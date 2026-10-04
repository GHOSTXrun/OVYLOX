const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(data,status=200)=>Response.json(data,{status,headers:JSON_HEADERS});
const keys=new Set(['ovy','egg','smile','dreamer','wink','spark','royal','dragon','crystal','sprout','star','astro','volt','treasure','flame','heart']);
function clean(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Choose a character and add a name.');
 const text=(k,n)=>String(raw[k]??'').trim().slice(0,n);
 const d={character:text('character',20),name:text('name',32),symbol:text('symbol',10).toUpperCase(),bg:text('bg',7),description:text('description',500),twitter:text('twitter',200),telegram:text('telegram',200),favorite:raw.favorite===true};
 if(!keys.has(d.character)||!d.name||!d.symbol||!/^[A-Z0-9]{1,10}$/.test(d.symbol)||!/^#[0-9a-f]{6}$/i.test(d.bg))throw Error('Check the character, name, ticker and background.');
 for(const k of ['twitter','telegram'])if(d[k]){let u;try{u=new URL(d[k]);}catch{throw Error('Enter a complete https link.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Links must use https.');}
 return d;
}
export async function handleAPI(request,env){
 const u=new URL(request.url),id=request.headers.get('oai-authenticated-user-id');
 if(u.pathname==='/api/me')return reply({authenticated:!!id,storage:!!env.DB});
 if(!id)return reply({error:'Sign in to save your creations.',code:'signin'},401);
 if(!env.DB)return reply({error:'Your collection is temporarily unavailable. You can still download your artwork.'},503);
 const match=u.pathname.match(/^\/api\/creations(?:\/([a-f0-9-]{36}))?$/);
 if(!match)return reply({error:'Not found.'},404);
 const cid=match[1];
 if(!['GET','POST','PUT','DELETE'].includes(request.method))return reply({error:'Method not allowed.'},405);
 if(request.method!=='GET'){
  if(request.headers.get('Origin')!==u.origin)return reply({error:'Reload this page and try again.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON is required.'},415);
 }
 try{
  if(request.method==='GET'){
   const rows=await env.DB.prepare('SELECT id,payload,created_at,updated_at FROM creations WHERE owner_id=? ORDER BY updated_at DESC LIMIT 200').bind(id).all();
   return reply({items:rows.results.map(r=>({...JSON.parse(r.payload),id:r.id,createdAt:r.created_at,updatedAt:r.updated_at}))});
  }
  if(request.method==='DELETE'){
   if(!cid)return reply({error:'Choose a creation.'},400);
   await env.DB.prepare('DELETE FROM creations WHERE id=? AND owner_id=?').bind(cid,id).run();return reply({ok:true});
  }
  const body=await request.text();if(body.length>8192)return reply({error:'The file is too large.'},413);
  let d;try{d=clean(JSON.parse(body));}catch(e){return reply({error:e.message},400);}
  const now=Date.now();
  if(request.method==='PUT'){
   if(!cid)return reply({error:'Choose a creation.'},400);
   const r=await env.DB.prepare('UPDATE creations SET payload=?,updated_at=? WHERE id=? AND owner_id=?').bind(JSON.stringify(d),now,cid,id).run();
   if(!r.meta.changes)return reply({error:'This creation no longer exists.'},404);
   return reply({item:{...d,id:cid,updatedAt:now}});
  }
  const uuid=crypto.randomUUID();
  const r=await env.DB.prepare('INSERT INTO creations(id,owner_id,payload,created_at,updated_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM creations WHERE owner_id=?)<200').bind(uuid,id,JSON.stringify(d),now,now,id).run();
  if(!r.meta.changes)return reply({error:'Your collection holds 200 creations. Export a backup and remove a creation before saving more.'},409);
  return reply({item:{...d,id:uuid,createdAt:now,updatedAt:now}},201);
 }catch(e){console.error('Collection operation failed',e);return reply({error:'Your collection could not be reached. Your current draft is still here; please retry.'},503);}
}
