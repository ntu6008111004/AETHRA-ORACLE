import http from 'http';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 256 * 1024;

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  const contents = fs.readFileSync(filePath, 'utf8');
  contents.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) return;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  });
  return true;
}

// Prefer AETHRA's own environment. For this local workspace, reuse the same
// owner-provided ThaiLLM credential as the CatLog project without exposing it
// to browser JavaScript.
loadEnvFile(path.join(rootDir, '.env'));
loadEnvFile(process.env.AETHRA_SHARED_ENV_FILE);
loadEnvFile(path.resolve(rootDir, '..', '..', 'ระบบลงบันทึกงาน', 'frontend', '.env'));

const AI_CONFIG = {
  apiKey: process.env.THAILLM_API_KEY || process.env.VITE_THAILLM_API_KEY || '',
  apiUrl: (() => {
    const configured = process.env.THAILLM_API_URL || process.env.VITE_THAILLM_API_URL || '';
    return /^https?:\/\//i.test(configured)
      ? configured
      : 'https://thaillm.or.th/api/v1/chat/completions';
  })(),
  model: process.env.THAILLM_MODEL || 'pathumma-thaillm-qwen3-8b-think-3.0.0',
  timeoutMs: 45000
};

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=UTF-8'
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error('Invalid JSON body.'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-12)
    .map(message => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: String(message?.content || '').trim().slice(0, 6000)
    }))
    .filter(message => message.content);
}

async function handleOracleChat(req, res) {
  if (!AI_CONFIG.apiKey) {
    sendJson(res, 503, {
      success: false,
      error: 'ai_not_configured',
      message: 'ยังไม่พบ API key ของ ThaiLLM ในเซิร์ฟเวอร์ AETHRA'
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const messages = normalizeMessages(body.messages);
    if (!messages.length) {
      sendJson(res, 400, { success: false, error: 'invalid_request', message: 'ไม่พบข้อความสำหรับส่งให้ AI' });
      return;
    }

    const context = String(body.context || '').trim().slice(0, 10000);
    const purpose = String(body.purpose || 'consultation').trim().slice(0, 80);
    const nowTh = new Date();
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const todayLine = 'วันนี้คือวันที่ ' + nowTh.getDate() + ' ' + thaiMonths[nowTh.getMonth()]
      + ' พ.ศ. ' + (nowTh.getFullYear() + 543) + ' (ค.ศ. ' + nowTh.getFullYear() + ')'
      + ' ให้ยึดปีนี้เป็นปีปัจจุบันเสมอ ห้ามอ้างปีที่ผ่านไปแล้วว่าเป็นอนาคต';

    const systemPrompt = `คุณคือ AETHRA ORACLE ผู้ช่วยตีความโหราศาสตร์ ไพ่ทาโรต์ และอี้จิงภาษาไทย
หน้าที่ของคุณคืออธิบายผลที่ระบบคำนวณให้คนทั่วไปเข้าใจ ไม่ใช่แต่งตำแหน่งดาว ไพ่ หรือเลขกว้าใหม่
ยึดข้อมูลบริบทที่ให้มาเท่านั้น ถ้าข้อมูลใดไม่มีหรือผู้ใช้จำไม่ได้ ให้ระบุข้อจำกัด ห้ามเดา
ตอบอย่างอบอุ่น ชัดเจน และเชื่อมโยงกับชีวิตจริง แยกเป็น: ความหมาย, เกี่ยวโยงกับสถานการณ์อย่างไร, สิ่งที่ควรทำ, สิ่งที่ควรระวัง
หลีกเลี่ยงคำฟันธงว่าเหตุการณ์จะเกิดแน่นอน ห้ามวินิจฉัยโรค ห้ามชี้นำให้เสี่ยงเงินก้อน และไม่อ้างว่าทดแทนผู้เชี่ยวชาญ
ภาษาหลักคือภาษาไทย ใช้ประโยคอ่านง่าย ความยาวประมาณ 350-700 คำเมื่อเป็นคำอ่านเชิงลึก และตอบตามคำถามเมื่อเป็นบทสนทนา
${todayLine}
ประเภทคำขอ: ${purpose}
บริบทที่คำนวณจาก AETHRA:\n${context || 'ไม่มีข้อมูลดวงกำเนิดเพิ่มเติม'}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);
    let upstream;
    try {
      upstream = await fetch(AI_CONFIG.apiUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          max_tokens: 6144,
          temperature: 0.55,
          messages: [{ role: 'system', content: systemPrompt }, ...messages]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = await upstream.json().catch(() => ({}));
    let answer = payload.choices?.[0]?.message?.content;
    // โมเดลแบบคิดก่อนตอบ (<think>) บางครั้งใช้โควตาคิดจนคำตอบจริงว่าง — ลองใหม่หนึ่งครั้ง
    const visible = String(answer || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (upstream.ok && !visible) {
      const retry = await fetch(AI_CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_CONFIG.apiKey}` },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          max_tokens: 6144,
          temperature: 0.4,
          messages: [
            { role: 'system', content: systemPrompt + String.fromCharCode(10) + 'ตอบทันทีแบบกระชับ ไม่ต้องคิดยาว' },
            ...messages
          ]
        })
      }).catch(() => null);
      const retryPayload = retry ? await retry.json().catch(() => ({})) : {};
      answer = retryPayload.choices?.[0]?.message?.content || answer;
    }
    if (!upstream.ok || !answer) {
      sendJson(res, upstream.status || 502, {
        success: false,
        error: upstream.status === 429 ? 'rate_limit' : 'provider_error',
        message: payload.error?.message || payload.message || 'ThaiLLM ไม่ส่งคำตอบกลับมา'
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      data: { answer, model: AI_CONFIG.model, usage: payload.usage || null }
    });
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    sendJson(res, error?.status || (isTimeout ? 504 : 500), {
      success: false,
      error: isTimeout ? 'timeout' : 'server_error',
      message: isTimeout ? 'AI ใช้เวลาตอบนานเกินไป กรุณาลองใหม่' : 'เซิร์ฟเวอร์ AETHRA เชื่อมต่อ AI ไม่สำเร็จ'
    });
  }
}

function serveStatic(req, res) {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  const relativePath = decodeURIComponent(reqUrl).replace(/^[/\\]+/, '');
  const filePath = path.resolve(rootDir, relativePath);
  if (!filePath.startsWith(path.resolve(rootDir) + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const notFoundPath = path.join(rootDir, '404.html');
      fs.readFile(notFoundPath, (err404, data404) => {
        if (err404) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end('404 Not Found');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(data404);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/oracle/health' && req.method === 'GET') {
    sendJson(res, 200, { success: true, configured: Boolean(AI_CONFIG.apiKey), provider: 'ThaiLLM / Qwen' });
    return;
  }
  if (pathname === '/api/oracle/chat' && req.method === 'POST') {
    handleOracleChat(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`✨ AETHRA ORACLE dev server running at http://localhost:${PORT}`);
  console.log(`🤖 ThaiLLM / Qwen: ${AI_CONFIG.apiKey ? 'configured' : 'not configured'}`);
});
