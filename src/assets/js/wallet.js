/* Optional Solana wallet connection. No signing, transactions or RPC requests. */
(function(){
'use strict';
var state={provider:null,kind:null,publicKey:null,connecting:false},listeners={},bound=new WeakSet();
function on(evt,fn){(listeners[evt]||(listeners[evt]=[])).push(fn)}
function emit(evt,p){(listeners[evt]||[]).forEach(function(fn){try{fn(p)}catch(e){console.error(e)}})}
function find(){var w=window;if(w.phantom&&w.phantom.solana&&w.phantom.solana.isPhantom)return{p:w.phantom.solana,kind:'Phantom'};if(w.solflare&&w.solflare.isSolflare)return{p:w.solflare,kind:'Solflare'};if(w.backpack&&w.backpack.isBackpack)return{p:w.backpack,kind:'Backpack'};if(w.solana&&(w.solana.isPhantom||w.solana.isSolflare||w.solana.isConnected!==undefined))return{p:w.solana,kind:'Solana'};return null}
function clear(){if(!state.publicKey)return;state.publicKey=null;emit('disconnected',{})}
function bind(found){state.provider=found.p;state.kind=found.kind;var p=found.p;if(!bound.has(p)&&typeof p.on==='function'){bound.add(p);p.on('accountChanged',function(pk){if(pk){state.publicKey=pk.toString();emit('connected',{publicKey:state.publicKey})}else clear()});p.on('disconnect',clear)}}
async function connect(){if(state.connecting)return null;state.connecting=true;emit('connecting',true);try{var found=find();if(!found){emit('error',{message:'No Solana wallet found.',hint:'Open this site in your wallet browser, or install a Solana wallet extension. You can still hatch and download.'});return null}bind(found);var result=found.p.publicKey&&found.p.isConnected?{publicKey:found.p.publicKey}:await found.p.connect();if(!result||!result.publicKey)throw Error('Wallet returned no public key.');state.publicKey=result.publicKey.toString();emit('connected',{publicKey:state.publicKey,kind:state.kind});return state.publicKey}catch(e){emit('error',{message:/reject|denied|cancel/i.test(e.message||'')?'Wallet connection cancelled.':e.message||'Could not connect the wallet.',hint:'Your character draft is unchanged.'});return null}finally{state.connecting=false;emit('connecting',false)}}
async function disconnect(){var p=state.provider;clear();try{if(p&&typeof p.disconnect==='function')await p.disconnect()}catch{}}
function init(){var found=find();if(!found)return;bind(found);if(found.p.publicKey&&found.p.isConnected){state.publicKey=found.p.publicKey.toString();emit('connected',{publicKey:state.publicKey,silent:true})}}
window.OVYLOX=window.OVYLOX||{};window.OVYLOX.wallet={state:state,on:on,connect:connect,disconnect:disconnect,address:function(){return state.publicKey},connected:function(){return !!state.publicKey},available:function(){return !!find()}};init();window.addEventListener('load',function(){setTimeout(init,350)},{once:true});
})();
