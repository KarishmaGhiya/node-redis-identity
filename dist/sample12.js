"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const identity_1 = require("@azure/identity");
const dotenv = require("dotenv");
dotenv.config();
async function returnPassword(credential) {
    try {
        // Fetch an Azure AD token to be used for authentication. This token will be used as the password.
        return credential.getToken("acca5fbb-b7e4-4009-81f1-37e38fd66d78/.default");
    }
    catch (e) {
        throw e;
    }
}
async function main() {
    // Construct a Token Credential from Azure Identity library, e.g. ClientSecretCredential / ClientCertificateCredential / ManagedIdentityCredential, etc.
    const credential = new identity_1.ClientSecretCredential(process.env.AZURE_TENANT_ID, process.env.AZURE_CLIENT_ID, process.env.AZURE_CLIENT_SECRET);
    let accessTokenObject = await returnPassword(credential);
    // Create node-redis client and connect to the Azure Cache for Redis over the TLS port using the access token as password.
    let redisClient = (0, redis_1.createClient)({
        username: process.env.REDIS_SERVICE_PRINCIPAL_NAME,
        password: accessTokenObject.token,
        url: `redis://${process.env.REDIS_HOSTNAME}:6380`,
        socket: {
            tls: true,
            keepAlive: 0
        },
    });
    await redisClient.connect();
    for (let i = 0; i < 3; i++) {
        try {
            // Set a value against your key in the Azure Redis Cache.
            await redisClient.set("Az:mykey", "value123"); // Returns a promise which resolves to "OK" when the command succeeds.
            // Fetch value of your key in the Azure Redis Cache.
            console.log("redis key:", await redisClient.get("Az:mykey"));
            // Close the Node-redis Client Connection
            redisClient.disconnect();
            break;
        }
        catch (e) {
            console.log("error during redis get", e.toString());
            if (accessTokenObject.expiresOnTimestamp <= Date.now()) {
                await redisClient.disconnect();
                accessTokenObject = await returnPassword(credential);
                redisClient = (0, redis_1.createClient)({
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
//# sourceMappingURL=sample12.js.map