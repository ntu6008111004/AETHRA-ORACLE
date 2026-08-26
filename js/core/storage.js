/**
 * AETHRA ORACLE — Storage & Profile State Management
 */

import { ALL_BIRTH_PLACES, findBirthPlace } from './thai-provinces.js';

const STORAGE_KEYS = {
  PROFILE: 'aethra_user_profile',
  HISTORY: 'aethra_readings_history',
  CONSULT_CHAT: 'aethra_consult_messages',
  THEME: 'aethra_theme',
  ONBOARDED: 'aethra_has_onboarded'
};

const memoryStore = new Map();
const safeStorage = {
  getItem: (key) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : (memoryStore.get(key) || null),
  setItem: (key, val) => typeof localStorage !== 'undefined' ? localStorage.setItem(key, String(val)) : memoryStore.set(key, String(val)),
  removeItem: (key) => typeof localStorage !== 'undefined' ? localStorage.removeItem(key) : memoryStore.delete(key),
  clear: () => typeof localStorage !== 'undefined' ? localStorage.clear() : memoryStore.clear()
};

/** รายชื่อสถานที่เกิดทั้งหมด: 77 จังหวัดไทย + เมืองต่างประเทศหลัก */
export const MAJOR_CITIES = ALL_BIRTH_PLACES;

export function resolveBirthPlace(value, previousProfile = null) {
  const birthPlace = String(value || '').trim();

  // 1) ค้นหาแบบยืดหยุ่น: พิมพ์ "กรุงเทพ" "โคราช" "หาดใหญ่" ก็เจอพิกัด
  const matched = findBirthPlace(birthPlace);
  if (matched) {
    return {
      birthPlace,
      matchedPlaceName: matched.name,
      lat: matched.lat,
      lon: matched.lon,
      timezone: matched.tz
    };
  }

  // 2) ถ้าพิมพ์ชื่อเดิมของโปรไฟล์เดิม ให้คงพิกัดเดิมไว้
  const sameAsPrevious = previousProfile?.birthPlace?.toLocaleLowerCase() === birthPlace.toLocaleLowerCase();
  return {
    birthPlace,
    matchedPlaceName: sameAsPrevious ? (previousProfile.matchedPlaceName || previousProfile.birthPlace) : null,
    lat: sameAsPrevious ? previousProfile.lat : null,
    lon: sameAsPrevious ? previousProfile.lon : null,
    timezone: sameAsPrevious ? previousProfile.timezone : null
  };
}

class StorageManager {
  constructor() {
    this.defaultProfile = {
      name: "Seeker",
      fullName: "Seeker",
      nickname: "Seeker",
      gender: "unspecified",
      birthDate: "1996-08-26",
      isBirthDateUnknown: false,
      birthTime: "09:30",
      isTimeUnknown: false,
      birthPlace: "กรุงเทพมหานคร",
      isBirthPlaceUnknown: false,
      lat: 13.7563,
      lon: 100.5018,
      timezone: 7,
      focus: "general",
      dataQuality: 100,
      createdAt: new Date().toISOString()
    };
  }

  isOnboarded() {
    return safeStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  }

  setOnboarded(status = true) {
    safeStorage.setItem(STORAGE_KEYS.ONBOARDED, status ? 'true' : 'false');
  }

  calculateDataQuality(profile) {
    let quality = 50;
    if (profile.name && profile.name.trim().length > 1) quality += 15;
    if (profile.birthDate && !profile.isBirthDateUnknown) quality += 15;
    if (profile.birthTime && !profile.isTimeUnknown) quality += 10;
    if (profile.birthPlace && Number.isFinite(profile.lat) && Number.isFinite(profile.lon)) quality += 10;
    return Math.min(100, quality);
  }

  getProfile() {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return { ...this.defaultProfile };

      const stored = JSON.parse(data);
      const merged = { ...this.defaultProfile, ...stored };
      merged.fullName = stored.fullName || stored.name || this.defaultProfile.fullName;
      merged.nickname = stored.nickname || stored.name || this.defaultProfile.nickname;
      merged.name = merged.fullName;
      return merged;
    } catch (e) {
      return this.defaultProfile;
    }
  }

  saveProfile(profile) {
    const current = this.getProfile();
    const fullName = profile.fullName || profile.name || current.fullName;
    const updated = {
      ...current,
      ...profile,
      name: fullName,
      fullName,
      updatedAt: new Date().toISOString()
    };
    updated.dataQuality = this.calculateDataQuality(updated);

    safeStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    this.setOnboarded(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aethra:profile-updated', { detail: updated }));
    }
    return updated;
  }

  getReadingsHistory() {
    try {
      const data = safeStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addReadingToHistory(reading) {
    const history = this.getReadingsHistory();
    const entry = {
      id: 'rd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: new Date().toISOString(),
      ...reading
    };
    history.unshift(entry);
    if (history.length > 50) history.pop();
    safeStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aethra:history-updated', { detail: history }));
    }
    return entry;
  }

  getConsultationMessages(topic = 'general') {
    try {
      const data = safeStorage.getItem(`${STORAGE_KEYS.CONSULT_CHAT}_${topic}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveConsultationMessage(topic, message) {
    const messages = this.getConsultationMessages(topic);
    messages.push({
      id: 'msg_' + Date.now(),
      timestamp: new Date().toISOString(),
      ...message
    });
    safeStorage.setItem(`${STORAGE_KEYS.CONSULT_CHAT}_${topic}`, JSON.stringify(messages));
    return messages;
  }

  exportData() {
    return JSON.stringify({
      version: "1.0",
      exportDate: new Date().toISOString(),
      profile: this.getProfile(),
      history: this.getReadingsHistory()
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.history)) {
        safeStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}

export const Storage = new StorageManager();
