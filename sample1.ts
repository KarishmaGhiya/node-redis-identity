import { createClient } from "redis";
import { ClientSecretCredential } from "@azure/identity";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Construct a Token Credential from Identity library, e.g. ClientSecretCredential / ClientCertificateCredential / ManagedIdentityCredential, etc.
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
  );

  // Fetch an AAD token to be used for authentication. This token will be used as the password.
  let accessToken = await credential.getToken(
    "https://*.cacheinfra.windows.net:10225/appid/.default"
  );
  console.log("access Token", accessToken);

  //Option 1 - Create redis client and connect to the Azure Cache for Redis over the TLS port using the access token as password.
  //   const client = createClient({
  //     username: process.env.REDIS_SERVICE_PRINCIPAL_NAME,
  //     password: accessToken.token,
  //     url: `redis://${process.env.REDIS_HOSTNAME}:6380`,
  //     socket: { tls: true },
  //   });

  //Option 2 - Create redis client and connect to the Azure Cache for Redis over the non-TLS port using the access token as password.
  const client = createClient({
    username: process.env.REDIS_SERVICE_PRINCIPAL_NAME,
    password: accessToken.token,
    url: `redis://${process.env.REDIS_HOSTNAME}:6379`,
  });

  client.on("error", (err) => console.log("Redis Client Error", err));
  await client.connect();
  // Set a value against your key in the Azure Redis Cache.
  await client.set("Az:key", "value1312");
  // Get value of your key in the Azure Redis Cache.
  console.log("value-", await client.get("Az:key"));
  // Close the client connection
  client.disconnect();
}

main().catch((err) => {
  console.log("error code: ", err.code);
  console.log("error message: ", err.message);
  console.log("error stack: ", err.stack);
});
