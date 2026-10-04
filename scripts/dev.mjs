import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {handleAPI} from '../worker/api.js';
import {localDB} from './local-db.mjs';
const DB=localDB('.local/creations.sqlite');
const html=await readFile('dist/index.html');
const server=http.createServer(async(req,res)=>{
 try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-development-user');const method=req.method;
 if(req.url.startsWith('/api/')){const request=new Request('http://127.0.0.1:8787'+req.url,{method,headers,...(!['GET','HEAD'].includes(method)?{body:Buffer.concat(chunks)}:{})});const response=await handleAPI(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}
 else{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)}
 }catch(e){console.error(e);res.writeHead(500);res.end('Local development error')}
});
// Never expose this development server publicly: it uses one local test account.
server.listen(8787,'127.0.0.1',()=>console.log('OVYLOX development: http://127.0.0.1:8787 (local test account)'));
