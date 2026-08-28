import { El, collectHtml } from './_tmp_dom.mjs';
import { Storage } from './js/core/storage.js';

const profile = {
  name: 'สมชาย', fullName: 'สมชาย ใจดี', nickname: 'ชาย', gender: 'male',
  birthDate: '1996-08-26', isBirthDateUnknown: false,
  birthTime: '09:30', isTimeUnknown: false,
  birthPlace: 'กรุงเทพมหานคร', isBirthPlaceUnknown: false,
  lat: 13.7563, lon: 100.5018, timezone: 7, focus: 'general', dataQuality: 100,
  createdAt: new Date().toISOString()
};
Storage.saveProfile(profile);
Storage.setOnboarded(true);

const views = [
  ['dashboard','./js/views/dashboard.js','DashboardView'],
  ['reading','./js/views/reading-view.js','ReadingView'],
  ['match','./js/views/match-view.js','MatchView'],
  ['elements','./js/views/elements-view.js','ElementsView'],
  ['phone','./js/views/phone-view.js','PhoneView'],
  ['other','./js/views/other-view.js','OtherView'],
  ['dream','./js/views/dream-view.js','DreamView'],
  ['traditions','./js/views/traditions.js','TraditionsView'],
  ['tarot','./js/views/tarot-view.js','TarotView'],
  ['iching','./js/views/iching-view.js','IChingView'],
  ['unified','./js/views/unified-view.js','UnifiedView'],
  ['consultation','./js/views/consultation.js','ConsultationView'],
  ['profile','./js/views/profile.js','ProfileView']
];

const results = {};
for (const [name, path, cls] of views) {
  try {
    const mod = await import(path);
    const V = mod[cls];
    const c = new El('div');
    V.render(c);
    results[name] = collectHtml(c).join('\n');
  } catch (e) {
    results[name] = '__ERROR__ ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,4).join('\n');
  }
}
import fs from 'fs';
fs.writeFileSync('_tmp_views.json', JSON.stringify(results, null, 1), 'utf8');
for (const k of Object.keys(results)) {
  console.log(k, results[k].startsWith('__ERROR__') ? results[k].split('\n')[0] : ('len=' + results[k].length));
}
