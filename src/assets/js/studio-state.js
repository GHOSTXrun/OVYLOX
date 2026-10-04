import {EMOJIS,emojiByKey} from './emojis.js';
export const DRAFT_KEY='ovylox:temporary-draft:v3';
export const EGG_KEY='ovylox:eggs:v3';
export function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
export function store(key,v){try{localStorage.setItem(key,JSON.stringify(v));return true;}catch{return false;}}
export function ticker(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10);}
export function cleanDraft(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!emojiByKey(raw.character))throw Error('This is not an OVYLOX draft.');
 const take=(key,max)=>String(raw[key]??'').trim().slice(0,max);
 const d={character:take('character',20),name:take('name',32),symbol:ticker(take('symbol',10)),bg:take('bg',7),description:take('description',500),twitter:take('twitter',200),telegram:take('telegram',200),favorite:raw.favorite===true};
 if(!/^#[0-9a-f]{6}$/i.test(d.bg))d.bg='#6d4dff';
 if(!d.name)d.name=emojiByKey(d.character).name;if(!d.symbol)d.symbol=ticker(d.name);
 for(const k of ['twitter','telegram'])if(d[k]){let u;try{u=new URL(d[k]);}catch{throw Error('Social links must be complete https links.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Social links must use https.');}
 if(typeof raw.id==='string'&&/^[a-f0-9-]{36}$/.test(raw.id))d.id=raw.id;
 return d;
}
export function defaultDraft(character='ovy'){const e=emojiByKey(character)||EMOJIS[0];return {character:e.key,name:e.name,symbol:ticker(e.name),bg:'#6d4dff',description:'',twitter:'',telegram:'',favorite:false};}
export function eggs(){const e=read(EGG_KEY,[]);return Array.isArray(e)?e.filter(x=>emojiByKey(x.key)&&Number.isFinite(x.at)&&Date.now()-x.at<1200000):[];}
export function hatch(){const e=eggs();if(e.length>=5)throw Error('Your next egg opens in '+Math.max(1,Math.ceil((e[0].at+1200000-Date.now())/60000))+' minutes. You can keep editing your current character.');const n=new Uint32Array(1);crypto.getRandomValues(n);const key=EMOJIS[n[0]%EMOJIS.length].key;e.push({key,at:Date.now()});store(EGG_KEY,e);return key;}
export function downloadFile(contents,name,type='application/json'){const blob=contents instanceof Blob?contents:new Blob([contents],{type});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);}
export function draftFile(d){const {id,...data}=d;downloadFile(JSON.stringify({format:'ovylox-draft',version:1,...data},null,2),(d.symbol||'OVYLOX')+'-draft.json');}
export async function importDraft(file){if(!file||file.size>12000)throw Error('Choose an OVYLOX draft JSON file under 12 KB.');const raw=JSON.parse(await file.text());if(raw.format!=='ovylox-draft'||raw.version!==1)throw Error('Choose a draft exported by OVYLOX.');delete raw.id;return cleanDraft(raw);}
