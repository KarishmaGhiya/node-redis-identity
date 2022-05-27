import { createClient } from 'redis';
import * as dotenv from "dotenv";
import {ClientCertificateCredential} from "@azure/identity";
dotenv.config();



async function main(){
const credential = new ClientCertificateCredential(process.env.VINAY_TENANT_ID, process.env.VINAY_CLIENT_ID,process.env.VINAY_CERTIFICATEPATH)
try{
    let accessToken = await credential.getToken("https://*.cacheinfra.windows.net:10225/appid/.default")
    console.log("access Token",accessToken);

    const client = createClient({username: "walmartserviceprincipal", password: accessToken.token, url: `redis://walmartserviceprincipal:${accessToken.token}@${process.env.VINAY_HOSTNAME}:6379` })
    client.on('error', (err) => console.log('Redis Client Error', err));
    //'redis://alice:foobared@awesome.redis.server:6380'
    await client.connect();
    await client.auth({
      username: "walmartserviceprincipal",
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
  