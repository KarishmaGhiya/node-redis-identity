import { createClient } from 'redis';
import * as dotenv from "dotenv";
import {ClientSecretCredential} from "@azure/identity";
dotenv.config();



async function main(){
const credential = new ClientSecretCredential(process.env.AZURE_TENANT_ID, process.env.AZURE_CLIENT_ID,process.env.AZURE_CLIENT_SECRET)
try{
    let accessToken = await credential.getToken("https://*.cacheinfra.windows.net:10225/appid/.default")
    console.log("access Token",accessToken);

    const client = createClient({username: "kaghiya-test-service-principal", password: accessToken.token, url: `redis://kaghiya-test-service-principal:${accessToken.token}@${process.env.REDIS_HOSTNAME}:6379` })
    client.on('error', (err) => console.log('Redis Client Error', err));
    //'redis://alice:foobared@awesome.redis.server:6380'
    await client.connect();
    await client.auth({
      username: "kaghiya-test-service-principal",
      password:accessToken.token
    });
   await client.set('Az:key343', 'value');
   const value = await client.get('Az:key343');
   console.log("value", value);
}
catch(e){
      console.log("error during get token -");
  console.log(e);
}

}

main().catch((err) => {
    console.log("error code: ", err.code);
    console.log("error message: ", err.message);
    console.log("error stack: ", err.stack);
  });
  