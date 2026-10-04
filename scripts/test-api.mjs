import assert from 'node:assert/strict';
import {handleAPI} from '../worker/api.js';
import {localDB} from './local-db.mjs';
const DB=localDB();
const sample={character:'ovy',name:'Night Ovy',symbol:'NIGHT',bg:'#6d4dff',description:'A night explorer.',twitter:'',telegram:'',favorite:false};
async function call(user,method='GET',path='/api/creations',data,origin='https://example.test'){
 const headers={'Content-Type':'application/json',Origin:origin};if(user)headers['oai-authenticated-user-id']=user;
 const r=await handleAPI(new Request('https://example.test'+path,{method,headers,...(data===undefined?{}:{body:JSON.stringify(data)})}),{DB});return {status:r.status,data:await r.json()};
}
assert.equal((await call(null)).status,401);
assert.equal((await call('alice','POST','/api/creations',sample,'https://elsewhere.test')).status,403);
assert.equal((await call('alice','POST','/api/creations',{...sample,bg:'url(javascript:alert(1))'})).status,400);
assert.equal((await call('alice','POST','/api/creations',{...sample,twitter:'javascript:alert(1)'})).status,400);
const created=await call('alice','POST','/api/creations',sample);assert.equal(created.status,201);const id=created.data.item.id;
assert.equal((await call('alice')).data.items.length,1);assert.equal((await call('bob')).data.items.length,0);
assert.equal((await call('bob','PUT','/api/creations/'+id,{...sample,name:'stolen'})).status,404);
await call('bob','DELETE','/api/creations/'+id,{});assert.equal((await call('alice')).data.items.length,1);
assert.equal((await call('alice','PUT','/api/creations/'+id,{...sample,favorite:true,name:'Moon Ovy'})).status,200);
assert.equal((await call('alice')).data.items[0].favorite,true);
assert.equal((await call('alice')).data.items[0].name,'Moon Ovy');
for(let i=1;i<200;i++)assert.equal((await call('alice','POST','/api/creations',sample)).status,201);
assert.equal((await call('alice','POST','/api/creations',sample)).status,409);
await call('alice','DELETE','/api/creations/'+id,{});assert.equal((await call('alice')).data.items.length,199);
assert.equal((await call('alice','PUT','/api/creations/'+id,sample)).status,404);
DB.close();console.log('PASS: authentication, CSRF, input validation, durable CRUD, owner isolation and 200-item limit.');
