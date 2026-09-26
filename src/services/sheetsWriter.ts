import { HeritageSite, SITES_SHEET_HEADERS } from '../types';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  sheets: {
    id: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }[];
}

/**
 * Extracts the spreadsheet ID from various URL patterns or returns the raw ID.
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Pattern: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    return match[1];
  }

  // If it's already an ID (usually 44 characters containing alphanumeric and hyphens/underscores)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Fetches spreadsheet metadata (title and sheet tabs) from Google Sheets API.
 */
export async function getSpreadsheetInfo(
  spreadsheetId: string, 
  accessToken: string
): Promise<SpreadsheetInfo> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.error?.message || `HTTP error ${res.status}`;
    
    if (res.status === 403) {
      throw new Error(`Izin Ditolak (403): Akun Google Anda belum memiliki hak akses Edit pada Spreadsheet ini. Pastikan Anda adalah pemilik atau diberi izin "Editor" pada menu Bagikan Google Sheets.`);
    } else if (res.status === 404) {
      throw new Error(`Spreadsheet tidak ditemukan (404). Periksa kembali tautan atau ID Spreadsheet.`);
    } else if (res.status === 401) {
      throw new Error(`Sesi login Google telah berakhir. Silakan masuk (login) kembali.`);
    }
    
    throw new Error(`Gagal mengakses Google Spreadsheet: ${message}`);
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    id: s.properties.sheetId,
    title: s.properties.title,
    rowCount: s.properties.gridProperties?.rowCount,
    columnCount: s.properties.gridProperties?.columnCount
  }));

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Dokumen Tanpa Judul',
    sheets
  };
}

/**
 * Fetches the existing headers in Row 1 of a sheet tab.
 */
export async function getSheetHeaders(
  spreadsheetId: string, 
  sheetTitle: string, 
  accessToken: string
): Promise<string[]> {
  const range = `'${sheetTitle.replace(/'/g, "''")}'!1:1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.values && data.values.length > 0) {
        return (data.values[0] as string[]).map(v => (v || '').toString().trim());
      }
    }
  } catch (e) {
    console.warn('Gagal membaca header baris pertama:', e);
  }

  return [];
}

/**
 * Initializes row 1 with standard SITES_SHEET_HEADERS if the sheet tab is completely empty.
 */
export async function initializeSheetHeaders(
  spreadsheetId: string, 
  sheetTitle: string, 
  accessToken: string
): Promise<void> {
  const range = `'${sheetTitle.replace(/'/g, "''")}'!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: [Array.from(SITES_SHEET_HEADERS)]
    })
  });
}

/**
 * Maps a HeritageSite object to a row array, matching existing sheet columns if present
 * or defaulting to standard SITES_SHEET_HEADERS.
 */
export function mapSiteToRow(
  site: HeritageSite, 
  existingHeaders: string[],
  rowIndex: number = 1
): string[] {
  // If no existing headers found or headers match standard 37 columns
  if (!existingHeaders || existingHeaders.length === 0) {
    return [
      rowIndex.toString(),
      site.code || `DGL-${rowIndex.toString().padStart(3, '0')}`,
      site.name,
      site.category,
      site.classification || 'Situs Budaya',
      site.kelurahan,
      site.kecamatan,
      site.kabupaten,
      site.provinsi || 'Sulawesi Tengah',
      site.address,
      site.coordinates.lat.toString(),
      site.coordinates.lng.toString(),
      site.description,
      site.history,
      site.yearOrPeriod,
      site.status,
      site.skNumber || '-',
      site.skDate || '-',
      site.skLevel || 'Kabupaten',
      site.owner || 'Pemerintah Daerah / Adat',
      site.custodian || 'Dinas Kebudayaan Donggala',
      site.physicalCondition || 'Terawat',
      site.material || 'Alami / Kayu / Batu',
      site.dimensions || '-',
      site.images[0] || '',
      site.images[1] || '',
      site.images[2] || '',
      site.images[3] || '',
      site.virtualTourUrl || '',
      site.audioUrl || '',
      site.openingHours || '08:00 - 17:00 WITA',
      site.ticketPrice || 'Gratis',
      (site.facilities || []).join(', '),
      site.accessibility || 'Dapat diakses roda 2 dan roda 4',
      (site.tags || []).join(', '),
      site.referenceSource || 'Dinas Kebudayaan & Pariwisata Kab. Donggala',
      site.lastUpdated || new Date().toISOString().split('T')[0]
    ];
  }

  // Dynamic mapping based on column names in existing sheet
  return existingHeaders.map((rawHeader, colIdx) => {
    const header = rawHeader.toUpperCase().replace(/[\s\-_]+/g, '_');
    
    if (header.includes('NO') || header === 'NUM' || header === 'NOMOR') {
      return rowIndex.toString();
    }
    if (header.includes('KODE') || header === 'ID' || header === 'ID_SITUS') {
      return site.code || `DGL-${rowIndex.toString().padStart(3, '0')}`;
    }
    if (header.includes('NAMA') || header === 'JUDUL' || header === 'TITLE' || header === 'SITUS') {
      return site.name;
    }
    if (header.includes('KATEGORI') || header === 'CATEGORY' || header === 'JENIS') {
      return site.category;
    }
    if (header.includes('KLASIFIKASI') || header === 'TIPE') {
      return site.classification || 'Situs Budaya';
    }
    if (header.includes('KELURAHAN') || header === 'DESA') {
      return site.kelurahan;
    }
    if (header.includes('KECAMATAN') || header === 'DISTRICT') {
      return site.kecamatan;
    }
    if (header.includes('KABUPATEN') || header === 'KOTA') {
      return site.kabupaten;
    }
    if (header.includes('PROVINSI') || header === 'PROVINCE') {
      return site.provinsi || 'Sulawesi Tengah';
    }
    if (header.includes('ALAMAT') || header === 'LOKASI' || header === 'ADDRESS') {
      return site.address;
    }
    if (header.includes('LAT') || header.includes('LINTANG')) {
      return site.coordinates.lat.toString();
    }
    if (header.includes('LNG') || header.includes('LON') || header.includes('BUJUR')) {
      return site.coordinates.lng.toString();
    }
    if (header.includes('DESKRIPSI') || header === 'DESCRIPTION' || header === 'URAIAN') {
      return site.description;
    }
    if (header.includes('SEJARAH') || header === 'HISTORY' || header === 'NARASI') {
      return site.history;
    }
    if (header.includes('PERIODE') || header === 'TAHUN' || header === 'MASA') {
      return site.yearOrPeriod;
    }
    if (header.includes('STATUS') || header.includes('PENETAPAN')) {
      return site.status;
    }
    if (header.includes('NO_SK') || header.includes('NOMOR_SK') || header.includes('SK_NUM')) {
      return site.skNumber || '-';
    }
    if (header.includes('TANGGAL_SK') || header.includes('TGL_SK')) {
      return site.skDate || '-';
    }
    if (header.includes('TINGKAT_SK') || header.includes('TINGKAT')) {
      return site.skLevel || 'Kabupaten';
    }
    if (header.includes('PEMILIK') || header === 'KEPEMILIKAN' || header === 'OWNER') {
      return site.owner || 'Pemerintah Daerah / Adat';
    }
    if (header.includes('JURU_PELIHARA') || header === 'JUPEL' || header === 'CUSTODIAN') {
      return site.custodian || 'Dinas Kebudayaan Kab. Donggala';
    }
    if (header.includes('KONDISI') || header === 'CONDITION') {
      return site.physicalCondition || 'Terawat';
    }
    if (header.includes('BAHAN') || header.includes('MATERIAL')) {
      return site.material || 'Alami / Kayu / Batu';
    }
    if (header.includes('UKURAN') || header.includes('LUAS') || header.includes('DIMENSI')) {
      return site.dimensions || '-';
    }
    if (header.includes('FOTO_UTAMA') || header === 'FOTO' || header === 'GAMBAR' || header === 'URL_FOTO' || header === 'IMAGE') {
      return site.images[0] || '';
    }
    if (header.includes('FOTO_GALLERY_1') || header === 'FOTO_1' || header === 'GAMBAR_1') {
      return site.images[1] || '';
    }
    if (header.includes('FOTO_GALLERY_2') || header === 'FOTO_2' || header === 'GAMBAR_2') {
      return site.images[2] || '';
    }
    if (header.includes('FOTO_GALLERY_3') || header === 'FOTO_3' || header === 'GAMBAR_3') {
      return site.images[3] || '';
    }
    if (header.includes('VIRTUAL') || header.includes('VIDEO')) {
      return site.virtualTourUrl || '';
    }
    if (header.includes('AUDIO')) {
      return site.audioUrl || '';
    }
    if (header.includes('JAM') || header.includes('OPERASIONAL')) {
      return site.openingHours || '08:00 - 17:00 WITA';
    }
    if (header.includes('TIKET') || header.includes('BIAYA')) {
      return site.ticketPrice || 'Gratis';
    }
    if (header.includes('FASILITAS')) {
      return (site.facilities || []).join(', ');
    }
    if (header.includes('AKSES')) {
      return site.accessibility || 'Dapat diakses kendaraan roda 2 dan 4';
    }
    if (header.includes('TAGS') || header.includes('TAGAR') || header.includes('KATA_KUNCI')) {
      return (site.tags || []).join(', ');
    }
    if (header.includes('SUMBER') || header.includes('REFERENSI')) {
      return site.referenceSource || 'Dinas Kebudayaan & Pariwisata Kab. Donggala';
    }
    if (header.includes('UPDATE') || header.includes('TANGGAL') || header.includes('TERAKHIR')) {
      return site.lastUpdated || new Date().toISOString().split('T')[0];
    }

    return '';
  });
}

/**
 * Appends a new site directly to Google Sheets using Google Sheets API.
 */
export async function appendSiteToSpreadsheet(
  spreadsheetId: string,
  site: HeritageSite,
  accessToken: string,
  targetSheetTitle?: string,
  existingRowCount: number = 1
): Promise<{ success: boolean; sheetTitle: string; updatedRange: string }> {
  // 1. Fetch info to get valid sheet title
  const info = await getSpreadsheetInfo(spreadsheetId, accessToken);
  if (!info.sheets || info.sheets.length === 0) {
    throw new Error('Dokumen Google Spreadsheet tidak memiliki lembar (sheet) kerja.');
  }

  const selectedSheet = targetSheetTitle 
    ? (info.sheets.find(s => s.title.toLowerCase() === targetSheetTitle.toLowerCase()) || info.sheets[0])
    : info.sheets[0];

  const sheetTitle = selectedSheet.title;

  // 2. Inspect headers of row 1
  let existingHeaders = await getSheetHeaders(spreadsheetId, sheetTitle, accessToken);
  
  if (existingHeaders.length === 0) {
    // Sheet is empty, write default 37-column headers
    await initializeSheetHeaders(spreadsheetId, sheetTitle, accessToken);
    existingHeaders = Array.from(SITES_SHEET_HEADERS);
  }

  // 3. Map site to row
  const rowValues = mapSiteToRow(site, existingHeaders, existingRowCount + 1);

  // 4. Append row to spreadsheet
  const range = `'${sheetTitle.replace(/'/g, "''")}'!A1`;
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: [rowValues]
    })
  });

  if (!appendRes.ok) {
    const errorJson = await appendRes.json().catch(() => ({}));
    const message = errorJson.error?.message || `HTTP error ${appendRes.status}`;
    throw new Error(`Gagal menyimpan baris data ke Google Spreadsheet: ${message}`);
  }

  const resultData = await appendRes.json();
  const updatedRange = resultData.updates?.updatedRange || `${sheetTitle}!RowAdded`;

  return {
    success: true,
    sheetTitle,
    updatedRange
  };
}
