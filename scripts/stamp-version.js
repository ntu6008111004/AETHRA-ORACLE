/**
 * AETHRA ORACLE — ประทับเลขเวอร์ชันลงไฟล์ก่อน deploy
 * ------------------------------------------------------------------
 * ทำไมต้องมี:
 * เว็บนี้เป็นไฟล์นิ่งบน GitHub Pages เบราว์เซอร์จะจำไฟล์เก่าไว้ในเครื่อง
 * ถ้าชื่อไฟล์เหมือนเดิม บางเครื่องจะใช้ของเก่าต่อจนกว่าผู้ใช้จะกด Ctrl+Shift+R เอง
 *
 * ตัวนี้แก้โดยคำนวณรหัสจากเนื้อไฟล์จริงทั้งหมด (js กับ css)
 * แล้วต่อท้าย URL เป็น ?v=รหัส ทำให้พอโค้ดเปลี่ยน URL ก็เปลี่ยนตาม
 * เบราว์เซอร์จึงถือว่าเป็นไฟล์ใหม่และโหลดใหม่ทันที ถ้าโค้ดไม่เปลี่ยนรหัสก็เท่าเดิม
 *
 * ไฟล์ js นำเข้ากันเองด้วยชื่อไฟล์ตรง ๆ จึงต่อท้ายทีละไฟล์ไม่ได้
 * เลยใช้ import map ประกาศไว้ที่เดียวในหน้าเว็บ ว่าไฟล์ไหนให้ไปโหลด URL ไหน
 * วิธีนี้ไม่ต้องแก้ไฟล์ต้นฉบับสักไฟล์
 *
 * วิธีใช้: npm run stamp   (ทำก่อน git push ทุกครั้ง)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- AETHRA-VERSION-MAP:START -->';
const END = '<!-- AETHRA-VERSION-MAP:END -->';

/** ไล่เก็บไฟล์ทุกไฟล์ในโฟลเดอร์ที่ลงท้ายตามที่กำหนด */
function collect(dir, ext, found = []) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return found;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) collect(rel, ext, found);
    else if (entry.name.endsWith(ext)) found.push(rel);
  }
  return found;
}

export function buildVersionMap() {
  const jsFiles = collect('js', '.js').sort();
  const cssFiles = collect('css', '.css').sort();

  // รหัสเวอร์ชันคิดจากเนื้อไฟล์จริง โค้ดไม่เปลี่ยนรหัสก็ไม่เปลี่ยน
  const hash = crypto.createHash('sha256');
  for (const file of [...jsFiles, ...cssFiles]) {
    hash.update(file);
    hash.update(fs.readFileSync(path.join(ROOT, file)));
  }
  const version = hash.digest('hex').slice(0, 10);

  const imports = {};
  for (const file of jsFiles) {
    imports['./' + file] = './' + file + '?v=' + version;
    imports['/' + file] = './' + file + '?v=' + version;
  }

  return { version, jsFiles, cssFiles, imports };
}

export function stampHtml(html, { version, imports }) {
  const block = START + '\n'
    + '  <script type="importmap">\n'
    + '  ' + JSON.stringify({ imports }, null, 2).split('\n').join('\n  ') + '\n'
    + '  </script>\n'
    + '  ' + END;

  let out = html.includes(START)
    ? html.replace(new RegExp(START + '[\\s\\S]*?' + END), block)
    : html.replace('</head>', '  ' + block + '\n</head>');

  // ต่อเลขเวอร์ชันให้ไฟล์ css และไฟล์ js ที่เรียกจากหน้าเว็บโดยตรง
  out = out.replace(/(href="\.\/css\/[^"?]+\.css)(\?v=[^"]*)?"/g, '$1?v=' + version + '"');
  out = out.replace(/(src="\.\/js\/[^"?]+\.js)(\?v=[^"]*)?"/g, '$1?v=' + version + '"');

  return out;
}

function main() {
  const htmlPath = path.join(ROOT, 'index.html');
  const info = buildVersionMap();
  const before = fs.readFileSync(htmlPath, 'utf8');
  const after = stampHtml(before, info);

  if (before === after) {
    console.log('เวอร์ชันเดิมอยู่แล้ว (' + info.version + ') ไม่ต้องแก้อะไร');
    return;
  }

  fs.writeFileSync(htmlPath, after, 'utf8');
  console.log('ประทับเวอร์ชัน ' + info.version + ' เรียบร้อย');
  console.log('  ไฟล์ js ' + info.jsFiles.length + ' ไฟล์ / ไฟล์ css ' + info.cssFiles.length + ' ไฟล์');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
