import {CONFIG} from './config.js';
import {cleanDraft} from './studio-state.js';
import {createDeviceAPI} from './device-api.js';
const deviceAPI=CONFIG.storageMode==='device'?createDeviceAPI(cleanDraft):null;
export async function request(path,method='GET',data){
 if(deviceAPI)return deviceAPI(path,method,data);
 if(location.protocol==='file:')throw Object.assign(new Error('Open the online site to use cloud saves. You can download and import draft files here.'),{code:'offline'});
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const r=await fetch(path,{method,headers:method==='GET'?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:ctrl.signal,credentials:'same-origin'});
  const value=await r.json();if(!r.ok)throw Object.assign(new Error(value.error||'Please try again.'),{code:value.code,status:r.status});return value;
 }catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw new Error('Connection unavailable. Your draft is still here; please retry or download it.');throw e;}finally{clearTimeout(timer);}
}
export const api={me:()=>request('/api/me'),list:()=>request('/api/creations'),save:d=>request('/api/creations'+(d.id?'/'+d.id:''),d.id?'PUT':'POST',d),remove:id=>request('/api/creations/'+id,'DELETE',{})};
