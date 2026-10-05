/* Optional Solana wallet connection. No signing, transactions or RPC requests. */
(function(){
'use strict';
var state={provider:null,kind:null,publicKey:null,connecting:false},listeners={},bound=new WeakSet();
function on(evt,fn){(listeners[evt]||(listeners[evt]=[])).push(fn)}
function emit(evt,p){(listeners[evt]||[]).forEach(function(fn){try{fn(p)}catch(e){console.error(e)}})}
function wallets(){
 var w=window,items=[];
 function add(p,kind){if(p&&typeof p.connect==='function'&&!items.some(function(x){return x.p===p}))items.push({p:p,kind:kind})}
 add(w.phantom&&w.phantom.solana,'Phantom');
 add(w.solflare,'Solflare');
 add(w.backpack&&w.backpack.solana||w.backpack,'Backpack');
 if(w.solana){var name=w.solana.isPhantom?'Phantom':w.solana.isSolflare?'Solflare':w.solana.isBackpack?'Backpack':'Solana wallet';if(!items.some(function(x){return x.kind===name}))add(w.solana,name)}
 return items;
}
function clear(){var had=state.publicKey;state.publicKey=null;if(had)emit('disconnected',{})}
function remember(pk){if(!pk)return false;var key=typeof pk.toBase58==='function'?pk.toBase58():pk.toString();if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key))return false;state.publicKey=key;emit('connected',{publicKey:key,kind:state.kind});return true}
function bind(found){
 state.provider=found.p;state.kind=found.kind;
 var p=found.p;if(bound.has(p)||typeof p.on!=='function')return;
 bound.add(p);
 p.on('connect',function(pk){if(state.provider===p)remember(pk&&pk.publicKey||pk||p.publicKey)});
 p.on('accountChanged',function(pk){if(state.provider!==p)return;if(!remember(pk))clear()});
 p.on('disconnect',function(){if(state.provider===p)clear()});
}
function choose(){
 return new Promise(function(resolve){
  var dialog=document.createElement('dialog');dialog.className='confirm-dialog';dialog.setAttribute('aria-labelledby','wallet-choice-title');
  dialog.innerHTML='<h2 id="wallet-choice-title">Connect wallet</h2><p>Choose your Solana wallet, unlock it, then approve the connection.</p><div data-wallet-options style="display:grid;gap:10px"></div><p data-wallet-help></p><button class="btn btn-ghost btn-md" data-wallet-close>Cancel</button>';
  var host=dialog.querySelector('[data-wallet-options]'),items=wallets(),done=false;
  function finish(found){if(done)return;done=true;dialog.close();dialog.remove();resolve(found)}
  items.forEach(function(found){var button=document.createElement('button');button.className='btn btn-primary btn-md';button.textContent=found.kind;button.addEventListener('click',function(){finish(found)});host.appendChild(button)});
  if(!items.length){
   dialog.querySelector('[data-wallet-help]').textContent='No wallet detected. Install a wallet extension and refresh, or open this site in your wallet app browser on mobile.';
   [['Get Phantom','https://phantom.com/download'],['Get Solflare','https://solflare.com/download']].forEach(function(item){var a=document.createElement('a');a.className='btn btn-primary btn-md';a.textContent=item[0];a.href=item[1];a.target='_blank';a.rel='noopener noreferrer';host.appendChild(a)});
  }else dialog.querySelector('[data-wallet-help]').textContent='Only your public wallet address is requested.';
  dialog.querySelector('[data-wallet-close]').addEventListener('click',function(){finish(null)});
  dialog.addEventListener('cancel',function(e){e.preventDefault();finish(null)});
  document.body.appendChild(dialog);dialog.showModal();
 });
}
function errorInfo(e){
 var code=Number(e&&e.code),message=String(e&&e.message||'');
 if(code===4001||/reject|denied|cancel/i.test(message))return{message:'Wallet connection cancelled.',hint:'Click Connect wallet to try again.'};
 if(code===-32002||/pending|already.*request/i.test(message))return{message:'A wallet request is already open.',hint:'Open your wallet extension and approve or cancel the pending request, then retry.'};
 if(/locked/i.test(message))return{message:'Your wallet is locked.',hint:'Unlock the extension, then click Connect wallet again.'};
 return{message:'Could not connect to '+(state.kind||'your wallet')+'.',hint:'Unlock the extension and allow this site to connect. If it still fails, reconnect this site in the wallet settings and refresh.'};
}
async function connect(kind){
 if(state.connecting)return null;
 state.connecting=true;emit('connecting',true);
 try{
  if(window.isSecureContext===false)throw Error('A secure HTTPS page is required.');
  var found=kind?wallets().find(function(x){return x.kind===kind}):await choose();
  if(!found)return null;
  bind(found);
  var result=found.p.isConnected&&found.p.publicKey?{publicKey:found.p.publicKey}:await found.p.connect();
  if(!remember(result&&result.publicKey||found.p.publicKey))throw Error('Wallet returned no public key.');
  return state.publicKey;
 }catch(e){clear();emit('error',errorInfo(e));return null}
 finally{state.connecting=false;emit('connecting',false)}
}
async function disconnect(){var p=state.provider;state.provider=null;state.kind=null;clear();try{if(p&&typeof p.disconnect==='function')await p.disconnect()}catch(e){}}
function init(){if(state.connecting||state.provider)return;var found=wallets().find(function(x){return x.p.isConnected&&x.p.publicKey});if(found){bind(found);remember(found.p.publicKey)}}
window.OVYLOX=window.OVYLOX||{};
window.OVYLOX.wallet={state:state,on:on,connect:connect,disconnect:disconnect,address:function(){return state.publicKey},connected:function(){return !!state.publicKey},available:function(){return wallets().length>0}};
on('connecting',function(active){var button=document.querySelector('[data-connect]'),label=document.querySelector('[data-wallet-label]');if(button){button.disabled=active;button.setAttribute('aria-busy',String(active))}if(label){label.textContent=active?'Connecting…':state.publicKey?state.publicKey.slice(0,4)+'…'+state.publicKey.slice(-4):'Connect wallet'}});
init();window.addEventListener('load',function(){setTimeout(init,350)},{once:true});
})();
