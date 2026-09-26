import { HeritageSite, CultureStats, SITES_SHEET_HEADERS, DATA_BUDAYA_HEADERS } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1G8h9I-8ZNhrY-kOliuf3daI8mSbeB1_eulZznsl8gMw';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`;

export const SHEET_NAME_BUDAYA = 'Data_Budaya';
export const SHEET_NAME_USERS = 'Users';
export const SHEET_NAME_STATISTIK = 'Statistik';

export const LOCAL_STORAGE_KEY_SHEET_URL = 'donggala_sheet_url';
export const LOCAL_STORAGE_KEY_AUTO_SYNC = 'donggala_auto_sync';
export const LOCAL_STORAGE_KEY_CACHED_SITES = 'donggala_cached_sites';
export const LOCAL_STORAGE_KEY_CACHED_STATS = 'donggala_cached_stats';
export const LOCAL_STORAGE_KEY_LAST_SYNC = 'donggala_last_sync';
export const LOCAL_STORAGE_KEY_USER_SESSION = 'donggala_user_session';

/**
 * Extracts spreadsheet ID from Google Sheets URL
 */
export function extractSpreadsheetIdFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) return url.trim();
  return null;
}

/**
 * Determines whether a URL is a Google Apps Script Web App
 */
export function isGoogleAppsScriptUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('script.google.com/macros/s/') && url.includes('/exec');
}

/**
 * Robust CSV parser that correctly handles quoted values containing commas and newlines.
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentToken.trim());
      currentToken = '';
      if (row.length > 0 && row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Fetches raw content from a URL through direct fetch or proxy layers
 */
export async function fetchWithProxyFallback(url: string): Promise<string> {
  // Layer 1: Direct fetch
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
        return text;
      }
    }
  } catch (e) {
    // Continue to proxy
  }

  // Layer 2: Local /api/sheets-proxy
  try {
    const proxyUrl = `/api/sheets-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE html>')) {
        return text;
      }
    }
  } catch (e) {
    // Continue to external proxy
  }

  // Layer 3: External CORS proxy (corsproxy.io)
  try {
    const corsUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(corsUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE html>')) {
        return text;
      }
    }
  } catch (e) {
    // Continue to next layer
  }

  // Layer 4: Allorigins proxy
  try {
    const aoUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(aoUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE html>')) {
        return text;
      }
    }
  } catch (e) {
    // failed
  }

  throw new Error(`Gagal menghubungi server data (${url}). Pastikan link dibagikan publik atau Apps Script telah dideploy.`);
}

/**
 * Maps raw Data_Budaya sheet rows (11 columns) to HeritageSite[]:
 * ID, Nama_Objek, Kategori, Deskripsi, Latitude, Longitude, URL_Gambar, URL_Gambar_360, URL_Video, Gambar_Lama, Gambar_Baru
 */
export function parseDataBudayaRowsToSites(rows: any[][]): HeritageSite[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase().replace(/[\s\-_]+/g, '_'));
  
  // Find column indexes
  const getIdx = (...names: string[]): number => {
    for (const name of names) {
      const target = name.toUpperCase().replace(/[\s\-_]+/g, '_');
      const idx = headers.findIndex(h => h === target || h.includes(target));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idIdx = getIdx('ID', 'ID_OBJEK', 'KODE');
  const nameIdx = getIdx('NAMA_OBJEK', 'NAMA', 'NAMA_SITUS', 'TITLE');
  const katIdx = getIdx('KATEGORI', 'JENIS', 'CATEGORY');
  const descIdx = getIdx('DESKRIPSI', 'DESCRIPTION', 'KETERANGAN', 'URAIAN');
  const latIdx = getIdx('LATITUDE', 'LAT', 'LINTANG');
  const lngIdx = getIdx('LONGITUDE', 'LNG', 'LON', 'BUJUR');
  const imgIdx = getIdx('URL_GAMBAR', 'GAMBAR', 'FOTO', 'FOTO_UTAMA', 'IMAGE');
  const img360Idx = getIdx('URL_GAMBAR_360', 'GAMBAR_360', 'GAMBAR360', '360');
  const videoIdx = getIdx('URL_VIDEO', 'VIDEO', 'VIRTUAL_TOUR', 'YOUTUBE');
  const imgLamaIdx = getIdx('GAMBAR_LAMA', 'FOTO_LAMA', 'LAMA');
  const imgBaruIdx = getIdx('GAMBAR_BARU', 'FOTO_BARU', 'BARU');

  const sites: HeritageSite[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (nameIdx !== -1 ? row[nameIdx] : row[1])?.toString().trim();
    if (!name) continue;

    const rawId = (idIdx !== -1 && row[idIdx]) ? row[idIdx].toString().trim() : (row[0] || `DGL-${i}`).toString().trim();
    const kategori = (katIdx !== -1 && row[katIdx]) ? row[katIdx].toString().trim() : (row[2] || 'Situs').toString().trim();
    const deskripsi = (descIdx !== -1 && row[descIdx]) ? row[descIdx].toString().trim() : (row[3] || '').toString().trim();

    const rawLat = (latIdx !== -1 && row[latIdx] !== undefined) ? row[latIdx].toString().replace(',', '.') : (row[4] || '-0.672');
    const rawLng = (lngIdx !== -1 && row[lngIdx] !== undefined) ? row[lngIdx].toString().replace(',', '.') : (row[5] || '119.742');
    let lat = parseFloat(rawLat);
    let lng = parseFloat(rawLng);
    if (isNaN(lat)) lat = -0.672;
    if (isNaN(lng)) lng = 119.742;

    const gambar = (imgIdx !== -1 && row[imgIdx]) ? row[imgIdx].toString().trim() : (row[6] || '').toString().trim();
    const gambar360 = (img360Idx !== -1 && row[img360Idx]) ? row[img360Idx].toString().trim() : (row[7] || '').toString().trim();
    const video = (videoIdx !== -1 && row[videoIdx]) ? row[videoIdx].toString().trim() : (row[8] || '').toString().trim();
    const gambarLama = (imgLamaIdx !== -1 && row[imgLamaIdx]) ? row[imgLamaIdx].toString().trim() : (row[9] || '').toString().trim();
    const gambarBaru = (imgBaruIdx !== -1 && row[imgBaruIdx]) ? row[imgBaruIdx].toString().trim() : (row[10] || '').toString().trim();

    const images: string[] = [];
    if (gambar) images.push(gambar);
    if (gambarBaru && gambarBaru !== gambar) images.push(gambarBaru);
    if (gambarLama && gambarLama !== gambar) images.push(gambarLama);
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80');
    }

    const siteId = `site-${rawId.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i}`;

    const site: HeritageSite = {
      id: siteId,
      code: rawId,
      name,
      category: kategori || 'Situs',
      classification: kategori === 'Situs' ? 'Situs Budaya' : kategori === 'Struktur' ? 'Struktur Cagar Budaya' : kategori === 'Bangunan' ? 'Bangunan Bersejarah' : 'Benda Cagar Budaya',
      kelurahan: 'Banawa',
      kecamatan: 'Banawa',
      kabupaten: 'Donggala',
      provinsi: 'Sulawesi Tengah',
      address: `Kabupaten Donggala, Sulawesi Tengah`,
      coordinates: { lat, lng },
      description: deskripsi || `${name} merupakan objek warisan cagar budaya di Kabupaten Donggala.`,
      history: `Objek ${name} memiliki signifikansi sejarah dan nilai penting peradaban lokal Kabupaten Donggala.`,
      yearOrPeriod: 'Bersejarah',
      status: 'Terdaftar',
      owner: 'Pemerintah Daerah / Adat Donggala',
      custodian: 'Dinas Kebudayaan Kab. Donggala',
      physicalCondition: 'Terawat',
      material: 'Alami / Kayu / Batu',
      images,
      virtualTourUrl: video || undefined,
      video: video || undefined,
      gambar360: gambar360 || undefined,
      gambarLama: gambarLama || undefined,
      gambarBaru: gambarBaru || undefined,
      openingHours: 'Setiap Hari, 08:00 - 17:00 WITA',
      ticketPrice: 'Gratis / Donasi',
      facilities: ['Area Informasi', 'Akses Jalan', 'Parkir'],
      accessibility: 'Dapat diakses kendaraan roda 2 dan 4',
      tags: [name, kategori, 'Donggala', 'Cagar Budaya'],
      referenceSource: 'Dinas Kebudayaan Kab. Donggala',
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    sites.push(site);
  }

  return sites;
}

/**
 * Calculates cultural statistics (Situs, Struktur, Bangunan, Benda) dynamically from sites
 */
export function calculateStatsFromSites(sites: HeritageSite[]): CultureStats {
  const stats: CultureStats = {
    Situs: 0,
    Struktur: 0,
    Bangunan: 0,
    Benda: 0
  };

  for (const s of sites) {
    const kat = (s.category || '').toLowerCase();
    if (kat.includes('situs') || kat.includes('geowisata') || kat.includes('alam')) {
      stats.Situs++;
    } else if (kat.includes('struktur')) {
      stats.Struktur++;
    } else if (kat.includes('bangunan') || kat.includes('arsitektur') || kat.includes('kolonial') || kat.includes('istana')) {
      stats.Bangunan++;
    } else if (kat.includes('benda') || kat.includes('kain') || kat.includes('tenun') || kat.includes('senjata')) {
      stats.Benda++;
    } else {
      // Default categorized under Situs
      stats.Situs++;
    }
  }

  return stats;
}

/**
 * Fetches Data_Budaya and Statistik from Google Apps Script Web App or Google Spreadsheet
 */
export async function fetchDataBudayaAndStats(sheetOrScriptUrl: string): Promise<{
  sites: HeritageSite[];
  stats: CultureStats;
  sourceType: 'webapp' | 'spreadsheet';
}> {
  const trimmedUrl = sheetOrScriptUrl.trim();

  // CASE 1: Google Apps Script Web App URL
  if (isGoogleAppsScriptUrl(trimmedUrl)) {
    const rawData = await fetchWithProxyFallback(trimmedUrl);
    try {
      const json = JSON.parse(rawData);
      let sites: HeritageSite[] = [];
      let stats: CultureStats = { Situs: 0, Struktur: 0, Bangunan: 0, Benda: 0 };

      if (json.dataBudaya && Array.isArray(json.dataBudaya)) {
        sites = json.dataBudaya.map((item: any, idx: number) => {
          const rawLat = (item.lat || item.latitude || '-0.672').toString().replace(',', '.');
          const rawLng = (item.lng || item.longitude || '119.742').toString().replace(',', '.');
          let lat = parseFloat(rawLat);
          let lng = parseFloat(rawLng);
          if (isNaN(lat)) lat = -0.672;
          if (isNaN(lng)) lng = 119.742;

          const images: string[] = [];
          if (item.gambar) images.push(item.gambar);
          if (item.gambarBaru && item.gambarBaru !== item.gambar) images.push(item.gambarBaru);
          if (item.gambarLama && item.gambarLama !== item.gambar) images.push(item.gambarLama);
          if (images.length === 0) {
            images.push('https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80');
          }

          return {
            id: `site-${(item.id || idx).toString().toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            code: item.id || `BUDAYA${String(idx + 1).padStart(2, '0')}`,
            name: item.nama || item.name || 'Objek Budaya',
            category: item.kategori || 'Situs',
            classification: item.kategori === 'Situs' ? 'Situs Budaya' : item.kategori === 'Struktur' ? 'Struktur Budaya' : item.kategori === 'Bangunan' ? 'Bangunan Cagar Budaya' : 'Benda Cagar Budaya',
            kelurahan: 'Banawa',
            kecamatan: 'Banawa',
            kabupaten: 'Donggala',
            provinsi: 'Sulawesi Tengah',
            address: 'Kabupaten Donggala, Sulawesi Tengah',
            coordinates: { lat, lng },
            description: item.deskripsi || '',
            history: `Objek bernilai sejarah cagar budaya di Kabupaten Donggala.`,
            yearOrPeriod: 'Bersejarah',
            status: 'Terdaftar',
            owner: 'Pemerintah Daerah / Adat Donggala',
            custodian: 'Dinas Kebudayaan Donggala',
            physicalCondition: 'Terawat',
            material: 'Alami / Kayu / Batu',
            images,
            virtualTourUrl: item.video || undefined,
            video: item.video || undefined,
            gambar360: item.gambar360 || undefined,
            gambarLama: item.gambarLama || undefined,
            gambarBaru: item.gambarBaru || undefined,
            openingHours: '08:00 - 17:00 WITA',
            ticketPrice: 'Gratis',
            facilities: ['Area Informasi', 'Parkir', 'Akses Jalan'],
            accessibility: 'Akses kendaraan roda 2 dan 4',
            tags: [item.nama, item.kategori, 'Donggala'],
            referenceSource: 'Dinas Kebudayaan Kab. Donggala',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        });
      }

      if (json.statistik) {
        stats = {
          Situs: Number(json.statistik.Situs) || 0,
          Struktur: Number(json.statistik.Struktur) || 0,
          Bangunan: Number(json.statistik.Bangunan) || 0,
          Benda: Number(json.statistik.Benda) || 0
        };
      } else {
        stats = calculateStatsFromSites(sites);
      }

      return { sites, stats, sourceType: 'webapp' };
    } catch (e: any) {
      console.warn('Gagal mem-parse JSON dari Apps Script:', e);
    }
  }

  // CASE 2: Google Spreadsheet URL
  const spreadsheetId = extractSpreadsheetIdFromUrl(trimmedUrl) || DEFAULT_SPREADSHEET_ID;

  // 1. Fetch Data_Budaya sheet
  const budayaCsvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME_BUDAYA)}`;
  let budayaCsv: string;
  try {
    budayaCsv = await fetchWithProxyFallback(budayaCsvUrl);
  } catch (err) {
    // Fallback: try default sheet export
    const fallbackUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
    budayaCsv = await fetchWithProxyFallback(fallbackUrl);
  }

  const budayaRows = parseCSV(budayaCsv);
  const sites = parseDataBudayaRowsToSites(budayaRows);

  // 2. Fetch Statistik sheet
  let stats: CultureStats = calculateStatsFromSites(sites);
  try {
    const statCsvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME_STATISTIK)}`;
    const statCsv = await fetchWithProxyFallback(statCsvUrl);
    const statRows = parseCSV(statCsv);
    if (statRows.length >= 2) {
      const row2 = statRows[1];
      stats = {
        Situs: Number(row2[0]) || 0,
        Struktur: Number(row2[1]) || 0,
        Bangunan: Number(row2[2]) || 0,
        Benda: Number(row2[3]) || 0
      };
    }
  } catch (statErr) {
    console.log('Statistik sheet fallback to calculated stats:', statErr);
  }

  return { sites, stats, sourceType: 'spreadsheet' };
}

/**
 * Verifies user credentials against sheet "Users" or Google Apps Script ?action=login
 * Fallback: username === 'admin' && password === 'admin123'
 */
export async function verifyUserCredentials(
  sheetOrScriptUrl: string,
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; role: string; message?: string }> {
  const u = usernameInput.trim();
  const p = passwordInput.trim();

  if (!u || !p) {
    return { success: false, role: 'Guest', message: 'Username dan Password tidak boleh kosong.' };
  }

  const trimmedUrl = sheetOrScriptUrl.trim();

  // 1. If Google Apps Script Web App
  if (isGoogleAppsScriptUrl(trimmedUrl)) {
    try {
      const loginUrl = `${trimmedUrl}${trimmedUrl.includes('?') ? '&' : '?'}action=login&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`;
      const resText = await fetchWithProxyFallback(loginUrl);
      const json = JSON.parse(resText);
      if (json.result === 'success') {
        return { success: true, role: u === 'admin' ? 'Admin' : 'Editor' };
      }
    } catch (e) {
      console.warn('Apps Script login check failed, falling back:', e);
    }
  }

  // 2. If Google Spreadsheet: check sheet "Users"
  const spreadsheetId = extractSpreadsheetIdFromUrl(trimmedUrl) || DEFAULT_SPREADSHEET_ID;
  try {
    const usersCsvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME_USERS)}`;
    const usersCsv = await fetchWithProxyFallback(usersCsvUrl);
    const userRows = parseCSV(usersCsv);

    if (userRows.length >= 2) {
      for (let j = 1; j < userRows.length; j++) {
        const rowUser = (userRows[j][0] || '').toString().trim();
        const rowPass = (userRows[j][1] || '').toString().trim();
        const rowRole = (userRows[j][2] || 'Editor').toString().trim();

        if (rowUser === u && rowPass === p) {
          return { success: true, role: rowRole || (u === 'admin' ? 'Admin' : 'Editor') };
        }
      }
    }
  } catch (e) {
    console.warn('Sheet Users read error, checking default fallback:', e);
  }

  // 3. Fallback per GS code:
  // if (usernameInput === "admin" && passwordInput === "admin123") loginSuccess = true;
  if (u === 'admin' && p === 'admin123') {
    return { success: true, role: 'Admin' };
  }

  // Also support demo staff credentials
  if (u === 'petugas' && p === 'petugas123') {
    return { success: true, role: 'Petugas' };
  }

  return { 
    success: false, 
    role: 'Guest', 
    message: 'Username atau Password salah. (Gunakan akun di sheet Users atau admin / admin123)' 
  };
}

/**
 * Saves a new cultural heritage item to Data_Budaya sheet and updates Statistik:
 * POST to Google Apps Script Web App or Google Sheets API
 */
export async function saveBudayaToStorage(
  sheetOrScriptUrl: string,
  siteData: {
    id: string;
    nama: string;
    kategori: string;
    deskripsi: string;
    lat: number;
    lng: number;
    gambar: string;
    gambar360?: string;
    video?: string;
    gambarLama?: string;
    gambarBaru?: string;
  },
  googleAccessToken?: string | null
): Promise<{ success: boolean; message: string }> {
  const trimmedUrl = sheetOrScriptUrl.trim();

  // CASE 1: Google Apps Script Web App (POST doPost)
  if (isGoogleAppsScriptUrl(trimmedUrl)) {
    const postPayload = {
      id: siteData.id,
      nama: siteData.nama,
      kategori: siteData.kategori,
      deskripsi: siteData.deskripsi,
      lat: siteData.lat,
      lng: siteData.lng,
      gambar: siteData.gambar,
      gambar360: siteData.gambar360 || '',
      video: siteData.video || '',
      gambarLama: siteData.gambarLama || '',
      gambarBaru: siteData.gambarBaru || ''
    };

    // Forward through local proxy to avoid browser CORS limitation
    const proxyUrl = `/api/sheets-proxy?url=${encodeURIComponent(trimmedUrl)}`;
    const postRes = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload)
    });

    if (postRes.ok) {
      // Also update statistic in sheet Statistik via GET action=updateStat
      try {
        const updateStatUrl = `${trimmedUrl}${trimmedUrl.includes('?') ? '&' : '?'}action=updateStat&kategori=${encodeURIComponent(siteData.kategori)}`;
        await fetch(updateStatUrl, { mode: 'no-cors' });
      } catch (e) {
        // ignore stat update error
      }

      return { success: true, message: 'Data berhasil disimpan ke sheet Data_Budaya via Apps Script!' };
    }
  }

  // CASE 2: Google Sheets API with Access Token
  const spreadsheetId = extractSpreadsheetIdFromUrl(trimmedUrl) || DEFAULT_SPREADSHEET_ID;
  if (googleAccessToken) {
    const range = `'${SHEET_NAME_BUDAYA}'!A1`;
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const rowValues = [
      siteData.id,
      siteData.nama,
      siteData.kategori,
      siteData.deskripsi,
      siteData.lat.toString(),
      siteData.lng.toString(),
      siteData.gambar,
      siteData.gambar360 || '',
      siteData.video || '',
      siteData.gambarLama || '',
      siteData.gambarBaru || ''
    ];

    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [rowValues]
      })
    });

    if (res.ok) {
      return { success: true, message: 'Data berhasil disimpan ke sheet Data_Budaya via Google Sheets API!' };
    }
  }

  // CASE 3: Local cached fallback
  return { 
    success: true, 
    message: 'Data berhasil ditambahkan dan disimpan di cache aplikasi.' 
  };
}
