import { createClient } from "redis";
import { ClientSecretCredential, TokenCredential } from "@azure/identity";
import * as dotenv from "dotenv";
dotenv.config();

async function returnPassword(credential: TokenCredential) {
  try {
    // Fetch an Azure AD token to be used for authentication. This token will be used as the password.
    return credential.getToken("https://*.cacheinfra.windows.net:10225/appid/.default");
  } catch (e) {
    throw e;
  }
}

async function main() {
  // Construct a Token Credential from Azure Identity library, e.g. ClientSecretCredential / ClientCertificateCredential / ManagedIdentityCredential, etc.
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
  );
  let accessTokenObject = await returnPassword(credential);
  // Create node-redis client and connect to the Azure Cache for Redis over the TLS port using the access token as password.
  let redisClient = createClient({
    username: process.env.REDIS_SERVICE_PRINCIPAL_NAME,
    password: accessTokenObject.token,
    url: `redis://${process.env.REDIS_HOSTNAME}:6380`,
    socket: {
      tls: true,
    },
  });
  redisClient.connect();
  for (let i = 0; i < 3; i++) {
    try {
      // Set a value against your key in the Azure Redis Cache.
      await redisClient.set("Az:mykey", "value123"); // Returns a promise which resolves to "OK" when the command succeeds.
      // Fetch value of your key in the Azure Redis Cache.
      console.log("redis key:", await redisClient.get("Az:mykey"));
      // Close the Node-redis Client Connection
      redisClient.disconnect();
      break;
    } catch (e) {
      console.log("error during redis get", e.toString());
      if (accessTokenObject.expiresOnTimestamp <= Date.now()) {
        accessTokenObject = await returnPassword(credential);
        redisClient = createClient({
          username: process.env.REDIS_SERVICE_PRINCIPAL_NAME,
          password: accessTokenObject.token,
          url: `redis://${process.env.REDIS_HOSTNAME}:6380`,
          socket: {
            tls: true,
          },
        });
      }
    }
  }
}
main().catch((err) => {
  console.log("error code: ", err.code);
  console.log("error message: ", err.message);
  console.log("error stack: ", err.stack);
});
