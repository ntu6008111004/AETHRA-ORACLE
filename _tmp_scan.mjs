import fs from 'fs';
const data = JSON.parse(fs.readFileSync('_tmp_views.json','utf8'));

function visibleText(html) {
  let h = String(html);
  h = h.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  h = h.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // เก็บ placeholder / title / aria-label / alt เพราะผู้ใช้เห็น
  const extras = [];
  h.replace(/(?:placeholder|title|aria-label|alt|value)\s*=\s*"([^"]*)"/gi, (m,g)=>{extras.push(g); return m;});
  h = h.replace(/<[^>]*>/g, '\n');
  return (h + '\n' + extras.join('\n'));
}

const report = {};
for (const [view, html] of Object.entries(data)) {
  const text = visibleText(html);
  const hits = [];
  text.split('\n').forEach(line => {
    const t = line.trim();
    if (!t) return;
    if (/[A-Za-z]/.test(t) || /\bundefined\b|\bnull\b|\bNaN\b/.test(t)) {
      hits.push(t);
    }
  });
  if (hits.length) report[view] = [...new Set(hits)];
}
for (const [v, hits] of Object.entries(report)) {
  console.log('\n===== ' + v + ' =====');
  hits.forEach(h => console.log('  | ' + h.slice(0,200)));
}
