import fs from 'node:fs/promises';
import {build} from 'esbuild';

// Relative URLs work at /OVYLOX/ and at a custom domain's root.
await fs.rm('assets',{recursive:true,force:true});
await fs.mkdir('assets/fonts',{recursive:true});
await build({entryPoints:['src/assets/js/app.js'],outfile:'assets/app.js',bundle:true,
 format:'iife',target:'es2022',minify:true,define:{__OVYLOX_STATIC__:'true'},
 loader:{'.png':'file'},assetNames:'[name]',publicPath:'./assets'});
let html=await fs.readFile('src/index.html','utf8'),styles=[];
for(const match of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]){
 styles.push((await fs.readFile('src/'+match[1],'utf8')).replaceAll('../fonts/','./fonts/'));
 html=html.replace(match[0],'');
}
await fs.writeFile('assets/app.css',styles.join('\n'));
await fs.cp('src/assets/fonts','assets/fonts',{recursive:true});
await fs.copyFile('src/assets/js/wallet.js','assets/wallet.js');
html=html.replace('</head>','<link rel="stylesheet" href="./assets/app.css">\n</head>')
 .replace('src="./assets/js/wallet.js"','src="./assets/wallet.js"')
 .replace('type="module" src="./assets/js/app.js"','defer src="./assets/app.js"');
await fs.writeFile('index.html',html);
await fs.writeFile('.nojekyll','');
console.log('Built GitHub Pages site: index.html + assets/ (device storage).');
