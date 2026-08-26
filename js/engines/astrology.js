/**
 * AETHRA ORACLE — Astrology Calculation Engine
 * Supports Western Tropical, Thai Suriyayart, and Vedic Sidereal algorithms.
 */

export const ZODIAC_SIGNS = [
  { id: 'aries', nameEn: 'Aries', nameTh: 'เมษ', element: 'fire', ruler: 'Mars', symbol: '♈', startDeg: 0 },
  { id: 'taurus', nameEn: 'Taurus', nameTh: 'พฤษภ', element: 'earth', ruler: 'Venus', symbol: '♉', startDeg: 30 },
  { id: 'gemini', nameEn: 'Gemini', nameTh: 'เมถุน', element: 'air', ruler: 'Mercury', symbol: '♊', startDeg: 60 },
  { id: 'cancer', nameEn: 'Cancer', nameTh: 'กรกฎ', element: 'water', ruler: 'Moon', symbol: '♋', startDeg: 90 },
  { id: 'leo', nameEn: 'Leo', nameTh: 'สิงห์', element: 'fire', ruler: 'Sun', symbol: '♌', startDeg: 120 },
  { id: 'virgo', nameEn: 'Virgo', nameTh: 'กันย์', element: 'earth', ruler: 'Mercury', symbol: '♍', startDeg: 150 },
  { id: 'libra', nameEn: 'Libra', nameTh: 'ตุลย์', element: 'air', ruler: 'Venus', symbol: '♎', startDeg: 180 },
  { id: 'scorpio', nameEn: 'Scorpio', nameTh: 'พิจิก', element: 'water', ruler: 'Mars/Pluto', symbol: '♏', startDeg: 210 },
  { id: 'sagittarius', nameEn: 'Sagittarius', nameTh: 'ธนู', element: 'fire', ruler: 'Jupiter', symbol: '♐', startDeg: 240 },
  { id: 'capricorn', nameEn: 'Capricorn', nameTh: 'มังกร', element: 'earth', ruler: 'Saturn', symbol: '♑', startDeg: 270 },
  { id: 'aquarius', nameEn: 'Aquarius', nameTh: 'กุมภ์', element: 'air', ruler: 'Saturn/Uranus', symbol: '♒', startDeg: 300 },
  { id: 'pisces', nameEn: 'Pisces', nameTh: 'มีน', element: 'water', ruler: 'Jupiter/Neptune', symbol: '♓', startDeg: 330 }
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export class AstrologyEngine {
  // Convert Gregorian Date to Julian Day Number
  static getJulianDay(year, month, day, hour = 12, minute = 0) {
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    const dayFraction = (hour + minute / 60) / 24;
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + dayFraction + B - 1524.5;
  }

  // Calculate Sun Ecliptic Longitude (Tropical)
  static calculateSunLongitude(jd) {
    const n = jd - 2451545.0;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);
    let lambda = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
    lambda = (lambda + 360) % 360;
    return lambda;
  }

  // Calculate Moon Longitude approximation
  static calculateMoonLongitude(jd) {
    const n = jd - 2451545.0;
    const L = (218.316 + 13.176396 * n) % 360;
    const M = ((134.963 + 13.064993 * n) % 360) * (Math.PI / 180);
    const F = ((93.272 + 13.229350 * n) % 360) * (Math.PI / 180);
    let lambda = L + 6.289 * Math.sin(M) + 1.274 * Math.sin(2 * F - M);
    return (lambda + 360) % 360;
  }

  // Ascendant Calculation (Approximation based on LST and Geographic Latitude)
  static calculateAscendant(jd, lat = 13.7563, lon = 100.5018) {
    const T = (jd - 2451545.0) / 36525;
    // Greenwich Mean Sidereal Time (degrees)
    let GMST = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T) % 360;
    let LST = (GMST + lon + 360) % 360; // Local Sidereal Time
    const radLST = LST * (Math.PI / 180);
    const radLat = lat * (Math.PI / 180);
    const eps = 23.4392911 * (Math.PI / 180); // Obliquity of ecliptic

    const y = -Math.cos(radLST);
    const x = Math.sin(radLST) * Math.cos(eps) + Math.tan(radLat) * Math.sin(eps);
    let asc = Math.atan2(y, x) * (180 / Math.PI);
    asc = (asc + 360) % 360;
    return asc;
  }

  // Determine Zodiac Sign from Longitude Degree
  static getZodiacFromDegree(deg) {
    const normalized = (deg % 360 + 360) % 360;
    const index = Math.floor(normalized / 30);
    const sign = ZODIAC_SIGNS[index];
    const degreeInSign = normalized - sign.startDeg;
    return {
      ...sign,
      exactDegree: normalized,
      degreeInSign: parseFloat(degreeInSign.toFixed(2))
    };
  }

  // Lahiri Ayanamsha for Vedic / Sidereal Astrology
  static getLahiriAyanamsha(jd) {
    const T = (jd - 2451545.0) / 36525;
    return 23.85 + 1.396 * T;
  }

  // Complete Multi-Tradition Chart Calculation
  static calculateChart(birthDateStr, birthTimeStr = "12:00", lat = 13.7563, lon = 100.5018) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthDateStr || ''))) {
      throw new TypeError('A valid birth date is required for astrology calculations.');
    }

    const [year, month, day] = birthDateStr.split('-').map(Number);
    const hasExactTime = /^\d{2}:\d{2}$/.test(String(birthTimeStr || ''));
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lon);
    const [hour, minute] = (hasExactTime ? birthTimeStr : '12:00').split(':').map(Number);

    const jd = this.getJulianDay(year, month, day, hour, minute);
    
    // 1. Western Tropical Calculations
    const sunLong = this.calculateSunLongitude(jd);
    const moonLong = this.calculateMoonLongitude(jd);
    const ascLong = hasExactTime && hasCoordinates ? this.calculateAscendant(jd, lat, lon) : null;

    const sunSign = this.getZodiacFromDegree(sunLong);
    const moonSign = this.getZodiacFromDegree(moonLong);
    const ascSign = ascLong === null ? null : this.getZodiacFromDegree(ascLong);

    // 2. Vedic Sidereal Calculations
    const ayanamsha = this.getLahiriAyanamsha(jd);
    const vedicMoonLong = (moonLong - ayanamsha + 360) % 360;
    const vedicSunLong = (sunLong - ayanamsha + 360) % 360;
    const nakshatraIdx = Math.floor((vedicMoonLong / 360) * 27);
    const nakshatra = NAKSHATRAS[nakshatraIdx % 27];

    // 3. Thai Suriyayart Planetary Alignments
    const thaiSunSign = this.getZodiacFromDegree(sunLong - 23.2); // Traditional Thai rasi offset
    const thaiAscSign = ascLong === null ? null : this.getZodiacFromDegree(ascLong - 23.2);

    return {
      jd,
      western: {
        sun: sunSign,
        moon: moonSign,
        ascendant: ascSign,
        elementBalance: {
          fire: [sunSign, moonSign, ascSign].filter(s => s?.element === 'fire').length,
          earth: [sunSign, moonSign, ascSign].filter(s => s?.element === 'earth').length,
          air: [sunSign, moonSign, ascSign].filter(s => s?.element === 'air').length,
          water: [sunSign, moonSign, ascSign].filter(s => s?.element === 'water').length
        }
      },
      vedic: {
        nakshatra,
        moonSign: this.getZodiacFromDegree(vedicMoonLong),
        sunSign: this.getZodiacFromDegree(vedicSunLong),
        ayanamsha: parseFloat(ayanamsha.toFixed(3))
      },
      thai: {
        suriyayartSun: thaiSunSign,
        suriyayartAsc: thaiAscSign,
        chataElement: thaiSunSign.element
      },
      confidence: {
        hasExactTime,
        hasCoordinates,
        ascendantAvailable: ascSign !== null
      }
    };
  }
}
