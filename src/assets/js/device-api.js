export const DEVICE_KEY='ovylox:device-creations:v1';
const error=(message,code)=>Object.assign(new Error(message),{code});

// Static hosting uses an explicit device collection; cloud errors never fall back here.
export function createDeviceAPI(validate,getStorage=()=>globalThis.localStorage){
 function read(){
  let raw;
  try{raw=getStorage().getItem(DEVICE_KEY);}catch{throw error('Browser storage is unavailable. Export a draft to keep your work.','storage');}
  if(raw===null)return [];
  try{
   const items=JSON.parse(raw);
   if(!Array.isArray(items)||items.length>200)throw Error();
   return items.map(item=>{
    const clean=validate(item);
    if(!clean.id||!Number.isFinite(item.createdAt)||!Number.isFinite(item.updatedAt))throw Error();
    return {...clean,createdAt:item.createdAt,updatedAt:item.updatedAt};
   });
  }catch{throw error('The browser collection could not be read. Existing data has been kept. You can still export your current draft.','storage');}
 }
 function write(items){
  try{getStorage().setItem(DEVICE_KEY,JSON.stringify(items));}
  catch{throw error('The browser could not save this creation. Export a draft before leaving the page.','storage');}
 }
 return async function request(path,method='GET',data){
  if(path==='/api/me'&&method==='GET')return {authenticated:false,storage:true,mode:'device'};
  const match=path.match(/^\/api\/creations(?:\/([a-f0-9-]{36}))?$/);
  if(!match)throw error('Unknown collection request.','not_found');
  const id=match[1],items=read();
  if(!id&&method==='GET')return {items:items.sort((a,b)=>b.updatedAt-a.updatedAt)};
  if(!id&&method==='POST'){
   if(items.length>=200)throw error('Your collection holds 200 creations. Export and remove one to make room.','limit');
   const now=Date.now(),item={...validate(data),id:crypto.randomUUID(),createdAt:now,updatedAt:now};
   write([...items,item]);return {item};
  }
  const index=items.findIndex(item=>item.id===id);
  if(id&&method==='PUT'){
   if(index<0)throw error('This creation is no longer in this browser. Import a draft to create a new copy.','not_found');
   const item={...validate(data),id,createdAt:items[index].createdAt,updatedAt:Date.now()};
   items[index]=item;write(items);return {item};
  }
  if(id&&method==='DELETE'){write(items.filter(item=>item.id!==id));return {ok:true};}
  throw error('Unknown collection request.','not_found');
 };
}
