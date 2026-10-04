/* ==========================================================================
   OVYLOX — formatting, DOM and icon helpers
   ========================================================================== */

/* --------------------------------------------------------------------------
   Formatting
   -------------------------------------------------------------------------- */

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/** $1.24M / $12.3K / $0.00 */
export function usd(n, opts = {}) {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (opts.full) return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (a >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  if (a >= 1) return "$" + v.toFixed(2);
  if (a === 0) return "$0.00";
  return "$" + v.toFixed(4);
}

export function int(n) {
  return (Number(n) || 0).toLocaleString("en-US");
}

/** 3MxW…A9NZ */
export function addr(s, head = 4, tail = 4) {
  const v = String(s || "");
  if (v.length <= head + tail + 1) return v;
  return v.slice(0, head) + "…" + v.slice(-tail);
}

/** "15m ago" / "3h ago" / "Sep 24" */
export function timeAgo(iso) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 45) return "just now";
  if (s < 90) return "1m ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 30) return d + "d ago";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Sep 24 2026" */
export function dateStr(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* --------------------------------------------------------------------------
   DOM
   -------------------------------------------------------------------------- */

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

/** Attach one delegated listener for a whole page. */
export function on(root, event, sel, fn) {
  root.addEventListener(event, (e) => {
    const hit = e.target.closest(sel);
    if (hit && root.contains(hit)) fn(e, hit);
  });
}

/* --------------------------------------------------------------------------
   Toasts
   -------------------------------------------------------------------------- */

let toastHost = null;

export function toast(msg, kind = "ok", ms = 2600) {
  if (!toastHost) {
    toastHost = el('<div class="toasts" role="status" aria-live="polite"></div>');
    document.body.appendChild(toastHost);
  }
  const icon = kind === "err" ? "⚠" : "✓";
  const node = el(
    '<div class="toast ' + (kind === "err" ? "toast-err" : "toast-ok") + '">' +
    '<span aria-hidden="true">' + icon + "</span><span>" + esc(msg) + "</span></div>"
  );
  toastHost.appendChild(node);
  setTimeout(() => {
    node.style.transition = "opacity .2s, transform .2s";
    node.style.opacity = "0";
    node.style.transform = "translateY(6px)";
    setTimeout(() => node.remove(), 220);
  }, ms);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  } catch {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { if(!document.execCommand("copy"))throw Error('Clipboard unavailable'); toast("Copied to clipboard"); }
    catch { toast("Could not copy", "err"); }
    ta.remove();
  }
}

/* --------------------------------------------------------------------------
   Skeletons & empty states
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   Tiny inline icons (pixel-ish, 16px grid, currentColor)
   -------------------------------------------------------------------------- */

const ICONS = {
  feed: '<path d="M2 3h12v2H2zM2 7h12v2H2zM2 11h8v2H2z"/>',
  hatchlings: '<path d="M2 4h5v5H2zM9 4h5v5H9zM2 11h5v3H2zM9 11h5v3H9z"/>',
  tokens: '<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM7.2 5v1.4H6v1.3h1.2v1.6H6v1.3h1.2V12h1.6v-1.4H10V9.3H8.8V7.7H10V6.4H8.8V5z"/>',
  nest: '<path d="M8 1.2 1.5 6v8.3h4.2V9.4h4.6v4.9h4.2V6z"/>',
  pot: '<path d="M3 6h10v6a2 2 0 01-2 2H5a2 2 0 01-2-2zm2-4h6l1 3H4z"/>',
  season: '<path d="M8 1l2 4.2 4.6.6-3.4 3.2.9 4.6L8 11.4 3.9 13.6l.9-4.6L1.4 5.8 6 5.2z"/>',
  activity: '<path d="M1 8h3l2-5 3 10 2-5h4v2h-2.8l-3.4 6.4L7 7l-.6 1H1z"/>',
  hatch: '<path d="M8 1C5 1 3 4 3 7.5V13h10V7.5C13 4 11 1 8 1zm0 2c1.7 0 3 2 3 4.5V11H5V7.5C5 5 6.3 3 8 3z"/>',
  book: '<path d="M2 2h5v12H2zm7 0h5v12H9z"/>',
  x: '<path d="M12.6 1.5h2.4L9.9 7.1 15.8 15h-4.6l-3.6-4.7L3.4 15H1l5.4-6L1 1.5h4.7l3.2 4.3zM11.7 13.6h1.3L4.9 2.8H3.5z"/>',
  sun: '<path d="M8 4.5A3.5 3.5 0 108 11.5 3.5 3.5 0 008 4.5zM8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3.1 3.1l1.3 1.3M11.6 11.6l1.3 1.3M12.9 3.1l-1.3 1.3M4.4 11.6l-1.3 1.3"/>',
  moon: '<path d="M10.5 1.6A6.5 6.5 0 1014.4 10 5.2 5.2 0 0110.5 1.6z"/>',
  copy: '<path d="M5 1h7v2H7v7H5zm-2 4h7v10H3z"/>',
  ext: '<path d="M9 1h6v6h-2V4.4L7.4 10 6 8.6 11.6 3H9zM1 3h6v2H3v8h8V9h2v6H1z"/>',
  arrow: '<path d="M6 2l6 6-6 6-1.4-1.4L9.2 8 4.6 3.4z"/>',
  up: '<path d="M8 2l6 6h-4v6H6V8H2z"/>',
  down: '<path d="M8 14l-6-6h4V2h4v6h4z"/>',
  bolt: '<path d="M9 1L3 9h4l-1 6 6-8H8z"/>',
  flame: '<path d="M8 1s4 4 4 7.5A4 4 0 014 8.5C4 5 8 1 8 1zm0 12a2.5 2.5 0 01-2.5-2.5c0-1.6 1.7-3.3 2.5-4.2.8.9 2.5 2.6 2.5 4.2A2.5 2.5 0 018 13z"/>',
  coin: '<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3z"/>',
  search: '<path d="M6.5 1a5.5 5.5 0 014.3 8.9l3.6 3.6-1.4 1.4-3.6-3.6A5.5 5.5 0 116.5 1zm0 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"/>',
  wallet: '<path d="M1 3h12a1 1 0 011 1v8a1 1 0 01-1 1H1zm2 2v6h11V5zm8 2h2v2h-2z"/>',
  skull: '<path d="M4 2h8a3 3 0 013 3v4a3 3 0 01-2 2.8V14H3v-2.2A3 3 0 011 9V5a3 3 0 013-3zm1 4v2h2V6zm4 0v2h2V6zM6 11h4v2H6z"/>',
  check: '<path d="M6.2 11.4L2 7.2l1.4-1.4 2.8 2.8L12.6 2 14 3.4z"/>',
  cross: '<path d="M12.7 4.7L11.3 3.3 8 6.6 4.7 3.3 3.3 4.7 6.6 8l-3.3 3.3 1.4 1.4L8 9.4l3.3 3.3 1.4-1.4L9.4 8z"/>',
  lock: '<path d="M4 7V5a4 4 0 118 0v2h1v8H3V7zm2 0h4V5a2 2 0 10-4 0z"/>',
  shield: '<path d="M8 1l6 2.5V8c0 3.4-2.4 6.3-6 7-3.6-.7-6-3.6-6-7V3.5z"/>',
  chart: '<path d="M1 13h2V8H1zm4 0h2V3H5zm4 0h2V6H9zm4 0h2V1h-2z"/>',
  ghost: '<path d="M8 1a5 5 0 015 5v9l-2-1.5L9 15l-1-1.5L7 15l-2-1.5L3 15V6a5 5 0 015-5z"/>',
  chevron: '<path d="M10.6 2.6L5.2 8l5.4 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  drop: '<path d="M8 1s5 5.5 5 8.5A5 5 0 013 9.5C3 6.5 8 1 8 1z"/>',
};

export function icon(name, size = 16, cls = "") {
  const path = ICONS[name] || ICONS.coin;
  const fill = name === "sun" ? 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"' : 'fill="currentColor"';
  return '<svg class="ic ' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" ' +
    'aria-hidden="true" ' + fill + ">" + path + "</svg>";
}

/* --------------------------------------------------------------------------
   Pixel icons — 16×16 grids, one <rect> per horizontal run, crisp at any size
   -------------------------------------------------------------------------- */

const PX_ICONS = {
  // pump.fun's pill, drawn on the pixel grid.
  pump: {
    colors: { K: "#123524", G: "#54d38a", W: "#ffffff" },
    map: [
      "..........KKKK..",
      ".........KWWWWK.",
      "........KWWWWWWK",
      ".......KWWWWWWWK",
      "......KWWWWWWWWK",
      ".....KWWWWWWWWWK",
      "....KGKWWWWWWWK.",
      "...KGGGKWWWWWK..",
      "..KGGGGGKWWWK...",
      ".KGGGGGGGKWK....",
      "KGGGGGGGGGK.....",
      "KGGGGGGGGK......",
      "KGGGGGGGK.......",
      "KGGGGGGK........",
      ".KGGGGK.........",
      "..KKKK..........",
    ],
  },
  // The X logo: a hollow thick stroke and a thin one, in the current text colour.
  x: {
    colors: { K: "currentColor" },
    map: [
      "................",
      ".KKK............",
      ".KKKK.......KK..",
      ".KK.KK.....KKK..",
      "..KK.KK...KKK...",
      "...KK.KK.KKK....",
      "....KK.KKKK.....",
      ".....KK.KK......",
      "......KK.KK.....",
      ".....KKKK.KK....",
      "....KKK.KK.KK...",
      "...KKK...KK.KK..",
      "..KKK.....KK.KK.",
      "..KK.......KKKK.",
      "............KKK.",
      "................",
    ],
  },
  // "CA" (contract address) in bold pixel letters, in the current text colour.
  ca: {
    colors: { K: "currentColor" },
    map: [
      "................",
      "................",
      "................",
      "..KKKK...KKKK...",
      ".KK..KK.KK..KK..",
      ".KK.....KK..KK..",
      ".KK.....KK..KK..",
      ".KK.....KKKKKK..",
      ".KK.....KK..KK..",
      ".KK.....KK..KK..",
      ".KK..KK.KK..KK..",
      "..KKKK..KK..KK..",
      "................",
      "................",
      "................",
      "................",
    ],
  },
};

export function pxIcon(name, size = 16) {
  const icon = PX_ICONS[name];
  let rects = "";
  icon.map.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const ch = row[x];
      let run = 1;
      while (row[x + run] === ch) run++;
      if (icon.colors[ch]) rects += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + icon.colors[ch] + '"/>';
      x += run;
    }
  });
  return '<svg class="px-ic" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' + rects + "</svg>";
}
