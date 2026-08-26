/**
 * AETHRA ORACLE — บริการเชื่อมต่อ AI (ThaiLLM / Pathumma Qwen)
 * ------------------------------------------------------------------
 * รองรับ 2 โหมดอัตโนมัติ:
 *   1) โหมดเซิร์ฟเวอร์ (localhost): เรียกผ่าน /api/oracle/chat ของ scripts/server.js
 *      ปลอดภัยกว่าเพราะ key อยู่ฝั่งเซิร์ฟเวอร์
 *   2) โหมด GitHub Pages (static): เรียก ThaiLLM ตรงจากเบราว์เซอร์
 *      เคล็ดลับ CORS: ThaiLLM ตอบ access-control-allow-origin: * แต่ preflight (OPTIONS) พัง
 *      จึงต้องส่งแบบ "simple request" = Content-Type: text/plain + key ใน query (?apikey=)
 *      ซึ่งไม่ trigger preflight — ทดสอบแล้วได้ HTTP 200 จริง
 *
 * คำเตือน: ในโหมด static ใครก็ตามที่เปิดดูซอร์สโค้ดหน้าเว็บจะเห็น API key นี้ได้
 * เจ้าของโปรเจกต์รับทราบและเลือกใช้แบบนี้เอง (ฝากขึ้น GitHub Pages โดยไม่มีเซิร์ฟเวอร์)
 */

const LOCAL_CHAT_ENDPOINT = '/api/oracle/chat';
// เซิร์ฟเวอร์กลางของเจ้าของโปรเจกต์ (คุม CORS เองได้ ไม่โดน Cloudflare ของ ThaiLLM สุ่มบล็อก)
const PROXY_CHAT_ENDPOINT = 'https://catlog-api.dentcos.com/api/thaillm/chat/completions';
const PROXY_HEALTH_ENDPOINT = 'https://catlog-api.dentcos.com/api/thaillm/health';
const LOCAL_HEALTH_ENDPOINT = '/api/oracle/health';
const REQUEST_TIMEOUT_MS = 90000;

/** ค่าเชื่อมต่อโหมด static (GitHub Pages) */
const DIRECT_CONFIG = {
  apiUrl: 'https://thaillm.or.th/api/v1/chat/completions',
  apiKey: 'qNBb3Le1AxZtPNKDlPw3GObDPtBulxoq',
  model: 'pathumma-thaillm-qwen3-8b-think-3.0.0'
};

const SYSTEM_PROMPT_BASE = [
  'คุณคือ AETHRA ORACLE ผู้ช่วยอธิบายผลดูดวงภาษาไทยสำหรับคนทั่วไป',
  'หน้าที่ของคุณคืออธิบายผลที่ระบบคำนวณมาแล้ว ไม่ใช่คำนวณใหม่หรือแต่งตำแหน่งดาวเอง',
  'ยึดข้อมูลบริบทที่ให้มาเท่านั้น ถ้าข้อมูลใดไม่มี ให้บอกตรง ๆ ว่าไม่มี ห้ามเดา',
  'ตอบเป็นภาษาไทยล้วน ห้ามทับศัพท์ภาษาอังกฤษยกเว้นชื่อเฉพาะที่จำเป็น',
  'อธิบายศัพท์โหราศาสตร์ทุกคำที่ใช้ด้วยภาษาชาวบ้าน และยกตัวอย่างสถานการณ์จริง',
  'แบ่งคำตอบเป็นหัวข้อ: ความหมาย / เกี่ยวกับชีวิตคุณอย่างไร / สิ่งที่ควรทำ / สิ่งที่ควรระวัง',
  'ห้ามฟันธงว่าเหตุการณ์จะเกิดแน่นอน ห้ามวินิจฉัยโรค ห้ามชี้นำการพนันหรือการลงทุนเสี่ยง',
  'น้ำเสียงอบอุ่น ให้กำลังใจ แต่ตรงไปตรงมา'
].join('\n');

let cachedMode = null; // 'server' | 'direct'

export function parseOracleThinking(rawContent) {
  const raw = String(rawContent || '');
  const thinkingMatch = raw.match(/<think>([\s\S]*?)<\/think>/i);
  return {
    answer: raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim(),
    thinking: thinkingMatch?.[1]?.trim() || null
  };
}

function normalizeMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .slice(-12)
    .map(message => ({
      role: message?.role === 'assistant' || message?.role === 'oracle' ? 'assistant' : 'user',
      content: String(message?.content ?? message?.text ?? '').trim()
    }))
    .filter(message => message.content);
}

async function probeJson(url, timeoutMs = 6000) {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function detectMode() {
  if (cachedMode) return cachedMode;

  // 1) เซิร์ฟเวอร์ AETHRA ในเครื่อง (ตอนพัฒนา)
  const local = await probeJson(LOCAL_HEALTH_ENDPOINT, 3000);
  if (local?.success && local?.configured) {
    cachedMode = 'server';
    return cachedMode;
  }

  // 2) เซิร์ฟเวอร์กลาง catlog-api (ทางหลักของเว็บจริงบน GitHub Pages)
  const proxy = await probeJson(PROXY_HEALTH_ENDPOINT, 6000);
  if (proxy?.success && proxy?.configured) {
    cachedMode = 'proxy';
    return cachedMode;
  }

  // 3) เรียก ThaiLLM ตรง (สำรองสุดท้าย อาจโดน Cloudflare บล็อกในบางเครือข่าย)
  cachedMode = 'direct';
  return cachedMode;
}

/** เรียกผ่านเซิร์ฟเวอร์กลาง catlog-api (รูปแบบ OpenAI-compatible) */
async function callProxy(messages, context, purpose, signal) {
  const systemPrompt = SYSTEM_PROMPT_BASE
    + String.fromCharCode(10) + 'ประเภทคำขอ: ' + purpose
    + String.fromCharCode(10) + 'บริบทที่ระบบคำนวณไว้แล้ว:' + String.fromCharCode(10)
    + (context || 'ไม่มีข้อมูลดวงเพิ่มเติม');

  const response = await fetch(PROXY_CHAT_ENDPOINT, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_tokens: 6144,
      temperature: 0.55,
      messages: [{ role: 'system', content: systemPrompt }, ...messages]
    })
  });

  const payload = await response.json().catch(() => ({}));
  const answer = payload.choices?.[0]?.message?.content;
  if (!response.ok || !answer) {
    return {
      success: false,
      error: response.status === 429 ? 'rate_limit' : 'provider_error',
      message: payload.error?.message || 'ดวงดาวยังไม่เรียงตัว กรุณากดถามอีกครั้ง'
    };
  }
  return { success: true, rawAnswer: answer, model: 'pathumma-thaillm-qwen3-8b-think-3.0.0', usage: payload.usage || null };
}

/** เรียก ThaiLLM ตรงจากเบราว์เซอร์แบบเลี่ยง preflight */
async function callDirect(messages, context, purpose, signal) {
  const systemPrompt = SYSTEM_PROMPT_BASE
    + '\nประเภทคำขอ: ' + purpose
    + '\nบริบทที่ระบบคำนวณไว้แล้ว:\n' + (context || 'ไม่มีข้อมูลดวงเพิ่มเติม');

  const url = DIRECT_CONFIG.apiUrl + '?apikey=' + encodeURIComponent(DIRECT_CONFIG.apiKey);
  const response = await fetch(url, {
    method: 'POST',
    signal,
    // text/plain = simple request จึงไม่ยิง preflight ที่เซิร์ฟเวอร์ ThaiLLM ตอบไม่เป็น
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      model: DIRECT_CONFIG.model,
      max_tokens: 6144,
      temperature: 0.55,
      messages: [{ role: 'system', content: systemPrompt }, ...messages]
    })
  });

  const payload = await response.json().catch(() => ({}));
  const answer = payload.choices?.[0]?.message?.content;
  if (!response.ok || !answer) {
    return {
      success: false,
      error: response.status === 429 ? 'rate_limit' : 'provider_error',
      message: payload.error?.message || payload.message || 'ดวงดาวยังไม่เรียงตัว กรุณากดถามอีกครั้ง'
    };
  }
  return {
    success: true,
    rawAnswer: answer,
    model: DIRECT_CONFIG.model,
    usage: payload.usage || null
  };
}

/** เรียกผ่านเซิร์ฟเวอร์ AETHRA (โหมด localhost) */
async function callServer(messages, context, purpose, signal) {
  const response = await fetch(LOCAL_CHAT_ENDPOINT, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context, purpose })
  });
  const payload = await response.json().catch(() => ({}));
  const answer = payload.data?.answer;
  if (!response.ok || !answer) {
    return {
      success: false,
      error: payload.error || 'api_error',
      message: payload.message || 'ห้องปรึกษาติดขัดชั่วคราว กรุณากดถามอีกครั้ง'
    };
  }
  return {
    success: true,
    rawAnswer: answer,
    model: payload.data?.model || null,
    usage: payload.data?.usage || null
  };
}

export class OracleAIService {
  static async sendChat(messages, { context = '', purpose = 'consultation' } = {}) {
    const normalized = normalizeMessages(messages);
    if (!normalized.length) {
      return { success: false, error: 'invalid_request', message: 'กรุณาพิมพ์คำถามก่อนส่ง' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const mode = await detectMode();
      const order = mode === 'server'
        ? ['server', 'proxy', 'direct']
        : mode === 'proxy' ? ['proxy', 'direct'] : ['direct', 'proxy'];

      let result = null;
      for (const attempt of order) {
        if (attempt === 'server') result = await callServer(normalized, context, purpose, controller.signal);
        else if (attempt === 'proxy') result = await callProxy(normalized, context, purpose, controller.signal).catch(() => null);
        else result = await callDirect(normalized, context, purpose, controller.signal).catch(() => null);

        if (result?.success) {
          cachedMode = attempt;
          break;
        }
      }

      if (!result) result = { success: false, error: 'network_error', message: 'เชื่อมต่อห้องปรึกษาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' };
      if (!result.success) return result;

      const parsed = parseOracleThinking(result.rawAnswer);
      return {
        success: true,
        answer: parsed.answer,
        thinking: parsed.thinking,
        model: result.model,
        usage: result.usage,
        mode
      };
    } catch (error) {
      return {
        success: false,
        error: error?.name === 'AbortError' ? 'timeout' : 'network_error',
        message: error?.name === 'AbortError'
          ? 'หมอดูใช้เวลาเปิดตำรานานเกินไป กรุณาถามใหม่อีกครั้ง'
          : 'เชื่อมต่อห้องปรึกษาไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  static requestReading(prompt, context, purpose) {
    return this.sendChat([{ role: 'user', content: prompt }], { context, purpose });
  }

  /** ตรวจสถานะ: โหมดไหนก็ถือว่าพร้อม เพราะโหมด direct ใช้ได้เสมอถ้ามีเน็ต */
  static async health() {
    const mode = await detectMode();
    return {
      success: true,
      configured: true,
      mode,
      provider: mode === 'server' ? 'ThaiLLM ผ่านเซิร์ฟเวอร์ AETHRA' : 'ThaiLLM เชื่อมต่อตรง'
    };
  }
}
