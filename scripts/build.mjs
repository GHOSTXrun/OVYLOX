import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
const root=process.cwd();
const result=await build({entryPoints:['src/assets/js/app.js'],bundle:true,define:{__OVYLOX_STATIC__:'false'},write:false,format:'iife',target:'es2022',minify:true,loader:{'.png':'dataurl'}});
let html=await fs.readFile('src/index.html','utf8');
for(const match of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]){
 const file=path.resolve('src',match[1]);let css=await fs.readFile(file,'utf8');
 for(const asset of [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]){if(asset[1].startsWith('data:'))continue;const bytes=await fs.readFile(path.resolve(path.dirname(file),asset[1]));const mime=asset[1].endsWith('.ttf')?'font/ttf':'image/png';css=css.replace(asset[0],'url("data:'+mime+';base64,'+bytes.toString('base64')+'")');}
 html=html.replace(match[0],'<style>'+css+'</style>');
}
const wallet=await fs.readFile('src/assets/js/wallet.js','utf8');
html=html.replace('<script src="./assets/js/wallet.js"></script>','<script>'+wallet.replace(/<\/script/gi,'<\\/script')+'</script>');
html=html.replace('<script type="module" src="./assets/js/app.js"></script>','<script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
await fs.rm('dist',{recursive:true,force:true});
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/index.html',html);
const api=await fs.readFile('worker/api.js','utf8');
const entry=`${api}\nconst HTML=${JSON.stringify(html)};\nexport default {async fetch(request,env){const p=new URL(request.url).pathname;if(p.startsWith('/api/'))return handleAPI(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});return new Response(request.method==='HEAD'?null:HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}})}};\n`;
await fs.writeFile('dist/server/index.js',entry);
try{await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');}catch(e){if(e.code!=='ENOENT')throw e;await fs.writeFile('dist/.openai/hosting.json',JSON.stringify({d1:'DB'})+'\n');}
await fs.cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Built standalone HTML, Worker, and migrations ('+(Buffer.byteLength(html)/1024/1024).toFixed(2)+' MB HTML).');
