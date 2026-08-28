// DOM shim ขั้นต่ำ สำหรับ render view ใน Node
class El {
  constructor(tag='div'){ this.tagName=String(tag).toUpperCase(); this._html=''; this.children=[]; this.style={}; this.classList={add(){},remove(){},toggle(){},contains(){return false;}}; this.dataset={}; this.textContent=''; }
  set innerHTML(v){ this._html = String(v); }
  get innerHTML(){ return this._html; }
  appendChild(c){ this.children.push(c); return c; }
  append(...c){ c.forEach(x=>this.children.push(x)); }
  addEventListener(){} removeEventListener(){}
  querySelector(){ const e=new El('div'); e._stub=true; return e; } querySelectorAll(){ return []; }
  setAttribute(){} getAttribute(){ return null; } removeAttribute(){}
  closest(){ const e=new El('div'); e._stub=true; return e; } focus(){} scrollIntoView(){} remove(){}
  getBoundingClientRect(){ return {top:0,left:0,bottom:0,right:0,width:0,height:0}; }
  insertAdjacentHTML(pos, html){ this._html += String(html); }
  replaceChildren(...c){ this.children=c; }
  getContext(){ return new Proxy({}, { get: ()=> (()=>({ addColorStop(){} })) }); }
  toDataURL(){ return ''; }
}
function collectHtml(el, out=[]) {
  if (!el) return out;
  if (el._html) out.push(el._html);
  (el.children||[]).forEach(c=>collectHtml(c,out));
  if (el.textContent) out.push(el.textContent);
  return out;
}
const doc = {
  createElement: (t)=> new El(t),
  createTextNode: (t)=> ({ textContent:String(t) }),
  querySelector: ()=> { const e=new El('div'); e._stub=true; return e; },
  querySelectorAll: ()=> [],
  getElementById: ()=> { const e=new El('div'); e._stub=true; return e; },
  addEventListener(){}, removeEventListener(){},
  body: new El('body'),
  documentElement: new El('html')
};
globalThis.document = doc;
globalThis.window = globalThis;
globalThis.window.addEventListener = ()=>{};
globalThis.window.removeEventListener = ()=>{};
globalThis.window.dispatchEvent = ()=>{};
globalThis.window.scrollY = 0;
globalThis.window.innerWidth = 1200;
globalThis.window.matchMedia = ()=>({matches:false, addEventListener(){}, addListener(){}});
globalThis.CustomEvent = class { constructor(t,o){ this.type=t; Object.assign(this,o); } };
globalThis.requestAnimationFrame = (cb)=>{ };
globalThis.setTimeout = globalThis.setTimeout;

globalThis.fetch = async ()=>{ throw new Error('no network'); };
// navigator: use built-in
export { El, collectHtml };
