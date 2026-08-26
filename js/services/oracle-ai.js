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

import { currentDateContext } from './question-router.js';

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
  'คุณคือหมอดูไทยที่อธิบายผลดูดวงให้คนทั่วไปฟัง',
  'ระบบคำนวณดวงมาให้แล้ว หน้าที่ของคุณคือหยิบเฉพาะส่วนที่ตอบคำถามมาอธิบาย',
  '',
  'กฎเหล็กที่ห้ามละเมิด:',
  '1. ตอบเฉพาะสิ่งที่ถูกถาม ห้ามสรุปดวงทั้งหมดซ้ำทุกครั้ง',
  '2. ถ้าผู้ใช้ถามคนละเรื่องกับครั้งก่อน คำตอบต้องต่างกันโดยสิ้นเชิง ห้ามลอกคำตอบเดิม',
  '3. ยึดข้อมูลบริบทที่ให้มาเท่านั้น ไม่มีข้อมูลให้บอกตรง ๆ ว่าดูไม่ได้ ห้ามเดา',
  '4. ภาษาไทยล้วน ห้ามใส่คำอังกฤษในวงเล็บ เช่น ห้ามเขียน ราศีสิงห์ (Leo) หรือ ดวงอาทิตย์ (Sun)',
  '5. ใช้ภาษาชาวบ้าน ห้ามคำเชิงกวี เช่น วงจรชีวิต พลังงานไหลเวียน ความอุดมสมบูรณ์ ชีวิตแห้ง',
  '6. ทุกคำแนะนำต้องจับต้องได้ บอกให้ชัดว่าทำอะไร เมื่อไหร่ เช่น ใส่เสื้อสีเขียววันสัมภาษณ์งาน',
  '7. ขึ้นบรรทัดใหม่ทุกครั้งที่เปลี่ยนประเด็น หนึ่งบรรทัดหนึ่งเรื่อง ห้ามเขียนติดกันเป็นก้อนยาว',
  '8. หัวข้อให้ใช้เครื่องหมาย ## นำหน้า และรายการย่อยให้ขึ้นต้นด้วย -',
  '9. ห้ามฟันธงว่าเหตุการณ์จะเกิดแน่นอน ห้ามวินิจฉัยโรค ห้ามชี้นำการพนัน',
  '',
  'รูปแบบคำตอบไม่ตายตัว ให้ปรับตามชนิดคำถามที่ระบุมาในคำสั่งเฉพาะครั้ง'
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


/** ประกอบคำสั่งระบบ โดยใส่วันเวลาปัจจุบันไว้ด้านบนสุดเสมอ */
function buildSystemPrompt(context, purpose) {
  const NL = String.fromCharCode(10);
  return [
    SYSTEM_PROMPT_BASE,
    '',
    currentDateContext().blockTh,
    '',
    'ประเภทคำขอ: ' + purpose,
    'บริบทที่ระบบคำนวณไว้แล้ว:',
    context || 'ไม่มีข้อมูลดวงเพิ่มเติม'
  ].join(NL);
}

/** เรียกผ่านเซิร์ฟเวอร์กลาง catlog-api (รูปแบบ OpenAI-compatible) */
async function callProxy(messages, context, purpose, signal) {
  const systemPrompt = buildSystemPrompt(context, purpose);

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
  const systemPrompt = buildSystemPrompt(context, purpose);

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
  /**
   * ส่งคำถามให้ AI พร้อมระบบลองใหม่อัตโนมัติ
   *
   * ปัญหาที่แก้: บางครั้งครั้งแรกล้มเหลว (Cloudflare ของ ThaiLLM สุ่มบล็อก
   * หรือเน็ตสะดุดชั่วขณะ) แต่ถามซ้ำกลับได้ ผู้ใช้จึงเห็นข้อความ
   * "เชื่อมต่อไม่สำเร็จ" ทั้งที่ระบบใช้งานได้ปกติ
   *
   * วิธีแก้: ไล่ลองทุกช่องทางและลองซ้ำเงียบ ๆ ก่อน
   * จะแสดงข้อความผิดพลาดก็ต่อเมื่อลองครบทุกทางแล้วจริง ๆ
   */
  static async sendChat(messages, { context = '', purpose = 'consultation', onRetry = null } = {}) {
    const normalized = normalizeMessages(messages);
    if (!normalized.length) {
      return { success: false, error: 'invalid_request', message: 'กรุณาพิมพ์คำถามก่อนส่ง' };
    }

    const mode = await detectMode();
    // ไล่ลำดับช่องทาง โดยเริ่มจากช่องที่ตรวจพบว่าพร้อมที่สุด
    const order = mode === 'server'
      ? ['server', 'proxy', 'direct']
      : mode === 'proxy' ? ['proxy', 'direct', 'server'] : ['direct', 'proxy', 'server'];

    const callers = {
      server: callServer,
      proxy: callProxy,
      direct: callDirect
    };

    let lastFailure = null;
    let attemptNumber = 0;

    // ลองสองรอบ รอบละครบทุกช่องทาง เผื่อกรณีโดนบล็อกชั่วคราว
    for (let round = 0; round < 2; round++) {
      for (const channel of order) {
        attemptNumber += 1;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let result = null;
        try {
          result = await callers[channel](normalized, context, purpose, controller.signal);
        } catch (error) {
          result = {
            success: false,
            error: error?.name === 'AbortError' ? 'timeout' : 'network_error',
            message: error?.name === 'AbortError'
              ? 'หมอดูใช้เวลาเปิดตำรานานเกินไป'
              : 'เชื่อมต่อไม่สำเร็จชั่วคราว'
          };
        } finally {
          clearTimeout(timeout);
        }

        if (result?.success) {
          cachedMode = channel;
          const parsed = parseOracleThinking(result.rawAnswer);
          // บางครั้งโมเดลใช้โควตาไปกับการคิดจนเนื้อคำตอบว่าง ให้ถือว่าล้มเหลวและลองใหม่
          if (parsed.answer) {
            return {
              success: true,
              answer: parsed.answer,
              thinking: parsed.thinking,
              model: result.model,
              usage: result.usage,
              mode: channel,
              attempts: attemptNumber
            };
          }
          lastFailure = { success: false, error: 'empty_answer', message: 'หมอดูยังเรียบเรียงคำตอบไม่เสร็จ' };
        } else {
          lastFailure = result;
        }

        // แจ้งชั้นบนว่ากำลังลองใหม่ เพื่อให้ยังโชว์ข้อความกำลังคิดอยู่
        if (typeof onRetry === 'function') {
          try { onRetry(attemptNumber); } catch { /* ไม่ให้ตัวแจ้งทำให้ทั้งหมดพัง */ }
        }

        // หน่วงสั้น ๆ ก่อนลองช่องถัดไป ช่วยมากเวลาโดนจำกัดอัตราการเรียก
        await new Promise(resolve => setTimeout(resolve, 700 + round * 1500));
      }
    }

    return lastFailure || {
      success: false,
      error: 'network_error',
      message: 'ยังติดต่อหมอดูไม่ได้ กรุณาลองกดถามอีกครั้ง'
    };
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
