/** OVYLOX mascot family. One original atlas, shared by the gallery and coin preview. */

import { EMOJI_ROWS, CELL, SHEET_COLS, SHEET_ROWS, SHEET_WIDTH, SHEET_HEIGHT, SPRITE_REGIONS } from "./emoji-data.js";

import brandLogo from '../img/ovylox-logo.png';
import brandSheet from '../img/emojis.png';
export const SHEET_URL = brandSheet;
document.documentElement.style.setProperty('--ovylox-sheet', 'url("'+new URL(brandSheet,document.baseURI).href+'")');
document.querySelector('link[rel="icon"]').href=brandLogo;

export const EMOJIS = EMOJI_ROWS.map(([key, name, glyph, category], i) => ({ key, name, glyph, category, i }));
const BY_KEY = new Map(EMOJIS.map((e) => [e.key, e]));

export const CATEGORIES = [
      {key:"all",label:"All"}, {key:"mascots",label:"Ovy Family"}, {key:"eggs",label:"Magic Eggs"}
    ];

/** Coin-image backgrounds the hatcher can pick from. */
export const BACKGROUNDS = ["#6d4dff", "#ffc93d", "#5bb6f0", "#3ccf8e", "#ff7a59", "#ff8fc0", "#15131f", "#f4f1fd"];

export function emojiByKey(key) {
  return BY_KEY.get(key) || null;
}

/** A sprite as an inline element. `size` in CSS pixels; CSS scales a complete atlas cell. */
export function emojiEl(key, size = 32, cls = "") {
  if (key === "hatchling") return '<img class="ovylox-mark ' + cls + '" src="' + brandLogo + '" alt="OVYLOX" width="' + size + '" height="' + size + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;border-radius:8px">';
  const e = BY_KEY.get(key);
  if (!e) return '<span class="emo emo-missing ' + cls + '" style="--s:' + size + 'px" aria-hidden="true"></span>';
  const [x,y,w,h] = SPRITE_REGIONS[e.i];
  const scale=size*0.92/Math.max(w,h);
  const aw=w*scale, ah=h*scale;
  return '<span class="emo ovy-icon '+cls+'" role="img" aria-label="'+e.name+'" style="--s:'+size+'px">'+
    '<span class="ovy-sprite" style="width:'+aw+'px;height:'+ah+'px;left:'+((size-aw)/2)+'px;top:'+((size-ah)/2)+'px;background-size:'+(SHEET_WIDTH*scale)+'px '+(SHEET_HEIGHT*scale)+'px;background-position:'+(-x*scale)+'px '+(-y*scale)+'px"></span></span>';

}

let sheetPromise = null;
function sheet() {
  if (!sheetPromise) {
    sheetPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { sheetPromise = null; reject(new Error("The emoji sheet could not be loaded.")); };
      img.src = SHEET_URL;
    });
  }
  return sheetPromise;
}

/**
 * The coin image: the selected mascot centered on a solid background, 1024×1024 PNG.
 * Nearest-neighbour scaling keeps every pixel square.
 */
export async function coinImageDataURL(key, bg = BACKGROUNDS[0]) {
  const e = BY_KEY.get(key);
  if (!e) throw new Error("Unknown emoji.");
  const img = await sheet();
  const size = 1024;
  const region = SPRITE_REGIONS[e.i];
  const scale = 896/Math.max(region[2],region[3]);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  x.fillStyle = bg;
  x.fillRect(0, 0, size, size);
  const [sx,sy,sw,sh] = region;
  const dw=sw*scale, dh=sh*scale;
  x.drawImage(img,sx,sy,sw,sh,(size-dw)/2,(size-dh)/2,dw,dh);
  return c.toDataURL("image/png");
}
