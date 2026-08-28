import './_tmp_dom.mjs';
const profile = {
  name:'สมชาย', fullName:'สมชาย ใจดี', nickname:'ชาย', gender:'male',
  birthDate:'1996-08-26', birthTime:'09:30', birthPlace:'กรุงเทพมหานคร',
  lat:13.7563, lon:100.5018, timezone:7, focus:'general'
};

function walk(node, path, out, seen=new Set()) {
  if (node === null || node === undefined) return;
  if (typeof node === 'string') {
    if (/[A-Za-z]/.test(node)) out.push([path, node.slice(0,180)]);
    else if (/undefined|NaN|\[object/.test(node)) out.push([path, node.slice(0,180)]);
    return;
  }
  if (typeof node === 'number') { if (!Number.isFinite(node)) out.push([path,'NaN/Infinity']); return; }
  if (typeof node !== 'object') return;
  if (seen.has(node)) return; seen.add(node);
  if (Array.isArray(node)) { node.forEach((v,i)=>walk(v, path+'['+i+']', out, seen)); return; }
  for (const [k,v] of Object.entries(node)) walk(v, path+'.'+k, out, seen);
}

const cases = [];
async function run(label, fn) {
  try { const r = await fn(); const out=[]; walk(r, label, out); cases.push([label,out]); }
  catch(e){ cases.push([label, [['__ERROR__', e.message]]]); }
}

const { LifeDomainsEngine } = await import('./js/engines/life-domains.js');
const { BaZiEngine } = await import('./js/engines/bazi.js');
const { AstrologyEngine } = await import('./js/engines/astrology.js');
const { ChineseZodiacEngine } = await import('./js/engines/chinese-zodiac.js');
const { ThaiAstrologyEngine } = await import('./js/engines/thai-astrology.js');
const { TaksaEngine } = await import('./js/engines/thai-taksa.js');
const { NumerologyEngine } = await import('./js/engines/numerology.js');
const { TarotEngine } = await import('./js/engines/tarot.js');
const { IChingEngine } = await import('./js/engines/iching.js');
const { UnifiedReadingEngine } = await import('./js/engines/unified.js');
const { DailyGuidanceEngine } = await import('./js/engines/daily-guidance.js');
const { CompatibilityEngine } = await import('./js/engines/compatibility.js');
const { PhoneNumerologyEngine } = await import('./js/engines/phone-numerology.js');
const { DreamEngine } = await import('./js/engines/dream.js');
const { ScoringEngine } = await import('./js/engines/scoring.js');

await run('LifeDomains', ()=>LifeDomainsEngine.analyze(profile));
await run('BaZi', ()=>BaZiEngine.calculate(profile.birthDate, profile.birthTime, profile.gender));
await run('Astrology', ()=>AstrologyEngine.calculate(profile));
await run('ChineseZodiac', ()=>ChineseZodiacEngine.analyze(profile.birthDate, profile.birthTime));
await run('ThaiAstro', ()=>ThaiAstrologyEngine.calculate(profile));
await run('Taksa', ()=>TaksaEngine.calculate(profile.birthDate, profile.birthTime));
await run('Numerology', ()=>NumerologyEngine.calculate(profile));
await run('Tarot3', ()=>TarotEngine.drawSpread ? TarotEngine.drawSpread(3) : TarotEngine.draw(3));
await run('IChing', ()=>IChingEngine.cast());
await run('Unified', ()=>UnifiedReadingEngine.generate(profile));
await run('Daily', ()=>DailyGuidanceEngine.generate(profile));
await run('Phone', ()=>PhoneNumerologyEngine.analyze('0812345678', profile.birthDate));
await run('Dream', ()=>DreamEngine.interpret ? DreamEngine.interpret('ฝันเห็นงูใหญ่') : null);

for (const [label, out] of cases) {
  if (!out.length) continue;
  console.log('\n===== ' + label + ' (' + out.length + ') =====');
  out.slice(0,80).forEach(([p,v])=>console.log('  ' + p + ' :: ' + v));
}
