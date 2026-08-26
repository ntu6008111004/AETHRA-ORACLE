/**
 * AETHRA ORACLE — ตัวช่วยให้เว็บอัปเดตเองทันทีที่ deploy
 * ------------------------------------------------------------------
 * ปัญหาเดิม: เว็บนี้เป็นไฟล์นิ่ง (static) วางบน GitHub Pages
 * เบราว์เซอร์จะเก็บไฟล์ไว้ในเครื่องแล้วใช้ของเก่าซ้ำ
 * ผู้ใช้บางเครื่องจึงต้องกด Ctrl+Shift+R เองถึงจะเห็นของใหม่
 *
 * วิธีแก้: ตัวนี้จะดักทุกคำขอไฟล์ของเว็บ แล้วไปเอาของสดจากเซิร์ฟเวอร์ก่อนเสมอ
 * (network first) ถ้าเน็ตล่มจริง ๆ ค่อยหยิบของที่เก็บไว้มาใช้แทน
 * ผลคือ deploy เสร็จ ผู้ใช้เปิดเว็บรอบถัดไปก็ได้ของใหม่เลย ไม่ต้องกดรีเฟรชแรง
 */

const CACHE_NAME = 'aethra-runtime';

// ติดตั้งแล้วให้ทำงานทันที ไม่ต้องรอปิดแท็บเก่า
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ตอนเริ่มทำงาน ให้ลบที่เก็บของเวอร์ชันเก่าทิ้ง แล้วคุมทุกแท็บที่เปิดอยู่
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // สนใจเฉพาะการเปิดอ่านไฟล์ปกติ ไม่ยุ่งกับการส่งข้อมูล
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }

  // ไม่ยุ่งกับไฟล์จากเว็บอื่น เช่น ฟอนต์ของ Google
  if (url.origin !== self.location.origin) return;

  // ไม่ยุ่งกับการคุยกับ AI เพราะต้องได้คำตอบสดทุกครั้งอยู่แล้ว
  if (url.pathname.includes('/api/')) return;

  event.respondWith((async () => {
    try {
      // ขอของสดจากเซิร์ฟเวอร์ โดยสั่งไม่ให้ใช้ของเก่าที่เบราว์เซอร์เก็บไว้
      const fresh = await fetch(request, { cache: 'no-store' });
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (err) {
      // เน็ตมีปัญหา ค่อยใช้ของที่เก็บไว้ เพื่อให้เว็บยังเปิดได้
      const cached = await caches.match(request);
      if (cached) return cached;
      throw err;
    }
  })());
});
