/**
 * AETHRA ORACLE — AI-powered consultation room.
 */

import { Storage } from '../core/storage.js';
import { I18n } from '../core/i18n.js';
import { SoundManager } from '../core/sound.js';
import { LifeDomainsEngine } from '../engines/life-domains.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';

const TOPICS = [
  { id: 'general', nameEn: 'General Life Reflection', nameTh: 'การสะท้อนชีวิตและภาพรวม' },
  { id: 'love', nameEn: 'Relationship & Harmony', nameTh: 'ความสัมพันธ์และความรัก' },
  { id: 'career', nameEn: 'Career & Ambition', nameTh: 'การงาน การเงิน และเป้าหมาย' },
  { id: 'spiritual', nameEn: 'Inner Path & Growth', nameTh: 'การค้นหาตัวตนและจิตวิญญาณ' }
];

const SUGGESTIONS = {
  general: [
    { en: 'What is shaping my current life chapter?', th: 'ช่วงนี้มีเรื่องอะไรที่กำลังขับเคลื่อนวงจรชีวิตของฉัน?' },
    { en: 'How can I balance action and inner calm?', th: 'ฉันจะสร้างสมดุลระหว่างสิ่งที่ต้องทำกับความสงบในใจได้อย่างไร?' }
  ],
  love: [
    { en: 'What relationship pattern should I understand?', th: 'มีรูปแบบความสัมพันธ์อะไรที่ฉันควรทำความเข้าใจให้ลึกขึ้น?' },
    { en: 'How can I build clarity and healthy boundaries?', th: 'ฉันจะรักษาความจริงใจและขอบเขตที่ดีในความสัมพันธ์ได้อย่างไร?' }
  ],
  career: [
    { en: 'Where should I focus my energy at work?', th: 'พลังของฉันควรไปอยู่ที่งานหรือการตัดสินใจแบบใดในช่วงนี้?' },
    { en: 'Should I begin or strengthen my foundation?', th: 'จังหวะนี้ควรเริ่มสิ่งใหม่หรือเสริมรากฐานเดิม และเพราะอะไร?' }
  ],
  spiritual: [
    { en: 'What inner lesson am I facing?', th: 'บทเรียนภายในที่ฉันกำลังเผชิญคืออะไร และควรรับมืออย่างไร?' },
    { en: 'What should I release to grow?', th: 'มีความคิดหรือความยึดติดใดที่ควรวางลงเพื่อเติบโต?' }
  ]
};

const TOPIC_DIRECTIVES = {
  general: 'คุณคือที่ปรึกษาภาพรวมชีวิต เชื่อมโยงทุกศาสตร์ในบริบทเข้าด้วยกัน ชี้ว่าช่วงนี้ควรโฟกัสเรื่องใดก่อน',
  love: 'คุณคือที่ปรึกษาด้านความรัก อ้างอิงภพคู่ครอง(7) นิสัยรักตามปีนักษัตร และสีศรีจากบริบทเป็นหลัก ถ้าผู้ใช้โสดให้แนะเรื่องการเปิดโอกาส ถ้ามีคู่ให้แนะเรื่องการประคองความสัมพันธ์',
  career: 'คุณคือที่ปรึกษาด้านการงานการเงิน อ้างอิงธาตุประจำตัว ความแข็งอ่อน รอบต้าอวิ้น ภพการงาน(10) ภพการเงิน(2) และสีเดช/มูละจากบริบทเป็นหลัก ให้คำแนะนำที่ลงมือทำได้จริง',
  spiritual: 'คุณคือที่ปรึกษาด้านการเติบโตภายใน อ้างอิงเลขเส้นทางชีวิต ธาตุเจ้าเรือน และจุดที่ต้องระวังของปีนักษัตร ชวนผู้ใช้ไตร่ตรองมากกว่าฟันธง'
};

function buildReadingContext(profile) {
  const result = LifeDomainsEngine.analyze(profile);
  if (!result.available) {
    return 'ผู้ใช้ไม่ทราบวันเกิด ระบบจึงไม่มีผลคำนวณดวงกำเนิด ห้ามเดาราศี ลัคนา ธาตุ หรือเลขศาสตร์ ให้ตอบเป็นคำแนะนำเชิงไตร่ตรองเท่านั้น';
  }

  const { meta } = result;
  const houses = meta.thai.houses;
  const lines = [
    'ชื่อที่ใช้เรียก: ' + (profile.nickname || 'ผู้รับคำอ่าน'),
    'วันเกิด: ' + meta.taksa.weekdayNameTh + ' ' + profile.birthDate + (meta.hasTime ? ' เวลา ' + profile.birthTime : ' (ไม่ทราบเวลาเกิด)'),
    'อายุประมาณ: ' + meta.age + ' ปี',
    'ราศีเกิดแบบสากล: ราศี' + meta.thai.westernSunSign.nameTh + ' / ราศีแบบไทย (นิรายนะ): ราศี' + meta.thai.thaiSunSignNameTh,
    'ปีนักษัตร: ปี' + meta.zodiac.nameTh + ' (' + meta.zodiac.animalTh + ') — จุดแข็ง: ' + meta.zodiac.profile.strengthTh + ' / ระวัง: ' + meta.zodiac.profile.cautionTh,
    'ธาตุประจำตัวดวงจีน: ธาตุ' + meta.bazi.dayMasterElement.nameTh + ' (' + meta.bazi.dayMaster.nameTh + ') — ' + meta.bazi.strength.labelTh,
    'คำอธิบายความแข็งอ่อน: ' + meta.bazi.strength.plainTh,
    'ธาตุที่ควรเสริม: ธาตุ' + meta.bazi.favourableElementsTh.join(' และธาตุ'),
    'ธาตุเจ้าเรือนแพทย์แผนไทย: ' + meta.thai.bodyElement.nameTh + ' — ' + meta.thai.bodyElement.natureTh,
    'เลขเส้นทางชีวิต: ' + meta.numerology.lifePath + ' (' + meta.numerology.meaningTh.title + ')',
    'เลขจังหวะชีวิตปีนี้: ' + meta.numerology.personalYear,
    'รอบโชคชะตา 10 ปีปัจจุบัน (ต้าอวิ้น): ' + meta.currentLuck.nameTh + ' อายุ ' + meta.currentLuck.ageFrom + '-' + meta.currentLuck.ageTo + ' ปี — ' + meta.currentLuck.verdictTh,
    'สถานะปีชงปีนี้: ' + (meta.chong.isChong ? meta.chong.matched[0].labelTh : 'ไม่ชง'),
    'สีมงคลจากทักษา: สีเดช(งาน)=' + meta.taksa.byId.dech.colorName + ' / สีศรี(เสน่ห์)=' + meta.taksa.byId.si.colorName + ' / สีมูละ(ทรัพย์)=' + meta.taksa.byId.mula.colorName + ' / สีกาลกิณี(เลี่ยง)=' + meta.taksa.byId.kalakini.colorName,
    houses.available
      ? 'ลัคนา: ราศี' + houses.ascendantNameTh
        + ' / ภพการเงิน(2): ราศี' + houses.byNumber[2].signNameTh
        + ' / ภพคู่ครอง(7): ราศี' + houses.byNumber[7].signNameTh
        + ' / ภพการงาน(10): ราศี' + houses.byNumber[10].signNameTh
        + ' / ภพลาภ(11): ราศี' + houses.byNumber[11].signNameTh
      : 'ไม่มีลัคนาและภพ 12 เพราะไม่ทราบเวลาเกิด — ห้ามเดาลัคนาหรือภพเด็ดขาด'
  ];
  return lines.join(String.fromCharCode(10));
}


/** ตัดสัญลักษณ์ markdown ออก เพราะห้องแชทแสดงข้อความล้วน */
function stripMarkdown(text) {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/`/g, '');
}

function createMessageElement(message) {
  if (message.role === 'user') {
    const user = document.createElement('div');
    user.className = 'consultation-msg-user';
    user.textContent = message.text;
    return user;
  }

  const oracle = document.createElement('div');
  oracle.className = `consultation-msg-oracle${message.isError ? ' is-error' : ''}`;
  const avatar = document.createElement('div');
  avatar.className = 'oracle-avatar';
  avatar.textContent = message.isLoading ? '⋯' : '✦';
  const content = document.createElement('div');
  content.className = 'oracle-msg-content';
  // formatAnswer escape HTML ภายในแล้ว จึงปลอดภัย และแปลงหัวข้อ/ลิสต์ให้อ่านเป็นข้อ ๆ
  content.innerHTML = ReadingView.formatAnswer(message.text);
  oracle.append(avatar, content);
  return oracle;
}

export class ConsultationView {
  static render(container) {
    container.innerHTML = `
      <div class="consultation-view-wrapper">
        <h2 style="font-size: var(--font-size-3xl); margin-bottom: var(--space-2);">${I18n.t('nav_consultation')}</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6);">หมอดูที่เห็นผลดวงของคุณครบทุกศาสตร์ พร้อมตอบคำถามต่อจากคำทำนายได้ทันที</p>

        <div class="consultation-wrapper">
          <div class="consultation-header">
            <div class="consultation-ai-heading">
              <span id="consultation-ai-dot" class="consultation-ai-dot"></span>
              <div>
                <strong>หมอดูประจำตัวของคุณ</strong>
                <small id="consultation-ai-status">กำลังจุดเทียนเปิดตำรา…</small>
              </div>
            </div>
            <button id="consultation-clear-btn" class="header-btn" type="button" title="ล้างบทสนทนาห้องนี้" style="height: 32px; font-size: 11px; white-space: nowrap;">
              🗑 ล้างแชท
            </button>
            <select id="consultation-topic-select" class="consultation-topic-select" aria-label="หัวข้อการปรึกษา">
              ${TOPICS.map(topic => `<option value="${topic.id}">${I18n.getLang() === 'th' ? topic.nameTh : topic.nameEn}</option>`).join('')}
            </select>
          </div>

          <div id="consultation-messages-stream" class="consultation-messages" aria-live="polite"></div>
          <div id="consultation-suggestions" class="consultation-suggestions"></div>
          <p class="consultation-privacy-note">คำถามและเฉพาะผลคำนวณที่จำเป็นจะถูกส่งให้ผู้ให้บริการ AI โดยไม่ส่งชื่อจริง วันเกิด หรือสถานที่เกิดดิบ</p>

          <div class="consultation-composer">
            <textarea id="consultation-input" class="consultation-textarea" rows="1" placeholder="${I18n.t('consult_input_placeholder')}"></textarea>
            <button id="consultation-send-btn" class="btn btn-primary" type="button">
              <span>${I18n.t('consult_send_btn')}</span>
            </button>
          </div>
        </div>
      </div>`;

    this.initConsultation(container);
  }

  static initConsultation(container) {
    const topicSelect = container.querySelector('#consultation-topic-select');
    const msgStream = container.querySelector('#consultation-messages-stream');
    const input = container.querySelector('#consultation-input');
    const sendBtn = container.querySelector('#consultation-send-btn');
    const suggestionsContainer = container.querySelector('#consultation-suggestions');
    const statusText = container.querySelector('#consultation-ai-status');
    const statusDot = container.querySelector('#consultation-ai-dot');
    const profile = Storage.getProfile();
    const readingContext = buildReadingContext(profile);
    let currentTopic = 'general';
    let isSending = false;

    const setConnectionState = (state, text) => {
      statusDot.dataset.state = state;
      statusText.textContent = text;
    };

    OracleAIService.health().then(health => {
      if (health.success && health.configured) setConnectionState('online', 'หมอดูประจำตัวพร้อมให้คำปรึกษา');
      else setConnectionState('offline', 'ห้องปรึกษายังไม่พร้อม กรุณาลองใหม่อีกครั้ง');
    });

    const renderSuggestions = () => {
      suggestionsContainer.replaceChildren();
      (SUGGESTIONS[currentTopic] || SUGGESTIONS.general).forEach(suggestion => {
        const button = document.createElement('button');
        button.className = 'suggestion-tag';
        button.type = 'button';
        button.textContent = I18n.getLang() === 'th' ? suggestion.th : suggestion.en;
        button.addEventListener('click', () => {
          input.value = button.textContent;
          input.focus();
        });
        suggestionsContainer.appendChild(button);
      });
    };

    const renderMessages = (loadingText = '') => {
      msgStream.replaceChildren();
      const messages = Storage.getConsultationMessages(currentTopic);
      if (!messages.length) {
        msgStream.appendChild(createMessageElement({
          role: 'oracle',
          text: ({
            general: 'สวัสดีครับ ห้องนี้คือที่ปรึกษาภาพรวมชีวิต ผมเห็นผลดวงของคุณครบทุกศาสตร์แล้ว ทั้งราศี ปีนักษัตร ธาตุประจำตัว เลขศาสตร์ และปีชง ถามได้เลยว่าช่วงนี้ควรโฟกัสเรื่องอะไร',
            love: 'สวัสดีครับ ห้องนี้คือที่ปรึกษาด้านความรักโดยเฉพาะ ผมจะอ้างอิงภพคู่ครอง นิสัยรักตามปีนักษัตร และสีเสริมเสน่ห์ของคุณ จะถามเรื่องคนโสด คนมีคู่ หรือคนที่กำลังคุยอยู่ก็ได้',
            career: 'สวัสดีครับ ห้องนี้คือที่ปรึกษาการงานการเงินโดยเฉพาะ ผมเห็นธาตุประจำตัว รอบโชคชะตา 10 ปี และภพการงานของคุณแล้ว ถามได้เลย เช่น ควรย้ายงานไหม เหมาะค้าขายหรือไม่',
            spiritual: 'สวัสดีครับ ห้องนี้คือที่ปรึกษาด้านการเติบโตภายใน ถามเรื่องความสงบใจ บทเรียนชีวิต หรือสิ่งที่ควรปล่อยวางได้เลย ผมจะอิงจากเลขเส้นทางชีวิตและธาตุเจ้าเรือนของคุณ'
          }[currentTopic] || 'สวัสดีครับ ถามเรื่องที่กังวลได้เลย') + ' — ผมจะไม่เดาข้อมูลที่ระบบคำนวณไม่ได้ครับ'
        }));
      } else {
        messages.forEach(message => msgStream.appendChild(createMessageElement(message)));
      }
      if (loadingText) msgStream.appendChild(createMessageElement({ role: 'oracle', text: loadingText, isLoading: true }));
      msgStream.scrollTop = msgStream.scrollHeight;
    };

    const handleSend = async () => {
      const text = input.value.trim();
      if (!text || isSending) return;

      isSending = true;
      sendBtn.disabled = true;
      input.disabled = true;
      setConnectionState('working', 'กำลังเปิดผังดวงของคุณ…');
      SoundManager.play('ui-select');
      Storage.saveConsultationMessage(currentTopic, { role: 'user', text });
      input.value = '';
      renderMessages('กำลังรวบรวมดวงชะตาและเรียบเรียงคำทำนายให้คุณ…');

      const history = Storage.getConsultationMessages(currentTopic).map(message => ({
        role: message.role === 'oracle' ? 'assistant' : 'user',
        content: message.text
      }));
      const topicName = TOPICS.find(topic => topic.id === currentTopic)?.nameTh || currentTopic;
      const result = await OracleAIService.sendChat(history, {
        purpose: `consultation:${currentTopic}`,
        context: `${readingContext}\nหัวข้อห้องสนทนา: ${topicName}
บทบาทของคุณ: ${TOPIC_DIRECTIVES[currentTopic] || TOPIC_DIRECTIVES.general}
นี่คือบทสนทนาต่อเนื่อง ให้จำและอ้างอิงสิ่งที่คุยกันก่อนหน้าในห้องนี้ด้วย`
      });

      Storage.saveConsultationMessage(currentTopic, {
        role: 'oracle',
        text: result.success ? stripMarkdown(result.answer) : `ขออภัยครับ ${result.message}`,
        isError: !result.success
      });
      if (result.success) {
        SoundManager.play('reading-complete');
        setConnectionState('online', 'หมอดูประจำตัวพร้อมให้คำปรึกษา');
      } else {
        SoundManager.play('error-alert');
        setConnectionState('offline', 'ดวงดาวยังไม่เรียงตัว กรุณาลองใหม่อีกครั้ง');
      }
      isSending = false;
      sendBtn.disabled = false;
      input.disabled = false;
      renderMessages();
      input.focus();
    };

    container.querySelector('#consultation-clear-btn')?.addEventListener('click', () => {
      if (!confirm('ล้างบทสนทนาในห้องนี้ทั้งหมด?')) return;
      Storage.clearConsultationMessages(currentTopic);
      SoundManager.play('ui-select');
      renderMessages();
    });

    topicSelect.addEventListener('change', event => {
      currentTopic = event.target.value;
      renderSuggestions();
      renderMessages();
    });
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    });

    renderSuggestions();
    renderMessages();
  }
}
