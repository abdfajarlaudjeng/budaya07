export type CategoryType = 
  | 'Situs'
  | 'Struktur'
  | 'Bangunan'
  | 'Benda'
  | 'Cagar Budaya'
  | 'Situs Sejarah'
  | 'Arsitektur Kolonial'
  | 'Wisata Bahari'
  | 'Geowisata'
  | 'Tradisi & Budaya'
  | 'Kawasan Pusaka'
  | string;

export type KelurahanType = 
  | 'Towale'
  | 'Labuan Bajo'
  | 'Boyadonggala'
  | 'Boneoge'
  | 'Kabila'
  | 'Tanjung Batu'
  | 'Maleni'
  | 'Ganti'
  | 'Banawa'
  | 'Banawa Tengah'
  | 'Banawa Selatan'
  | 'Sindue'
  | string;

export interface HeritageSite {
  id: string;
  code?: string; // e.g. BUDAYA06 or ID
  name: string;
  category: CategoryType;
  classification?: string;
  kelurahan: KelurahanType;
  kecamatan: string;
  kabupaten: string;
  provinsi?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  history: string;
  yearOrPeriod: string;
  status: 'Ditetapkan' | 'Terdaftar' | 'Rekomendasi' | 'Potensi' | string;
  skNumber?: string;
  skDate?: string;
  skLevel?: string;
  owner?: string;
  custodian?: string; // Juru pelihara
  physicalCondition?: string;
  material?: string;
  dimensions?: string;
  images: string[];
  virtualTourUrl?: string; // or URL_Video
  audioUrl?: string;
  openingHours?: string;
  ticketPrice?: string;
  facilities?: string[];
  accessibility?: string;
  tags?: string[];
  referenceSource?: string;
  lastUpdated?: string;

  // Specific fields from Data_Budaya sheet
  gambar360?: string; // URL_Gambar_360
  video?: string; // URL_Video
  gambarLama?: string; // Gambar_Lama
  gambarBaru?: string; // Gambar_Baru
}

export interface CultureStats {
  Situs: number;
  Struktur: number;
  Bangunan: number;
  Benda: number;
}

export interface UserSession {
  username: string;
  displayName: string;
  role: 'Admin' | 'Editor' | 'Petugas' | string;
  photoURL?: string;
  email?: string;
  isGoogleUser?: boolean;
}

export interface SpreadsheetSyncConfig {
  sheetUrl: string;
  sheetNameBudaya?: string;
  sheetNameUsers?: string;
  sheetNameStatistik?: string;
  autoSync: boolean;
  lastSyncTime?: string;
  rowCount?: number;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export const DATA_BUDAYA_HEADERS = [
  'ID',
  'Nama_Objek',
  'Kategori',
  'Deskripsi',
  'Latitude',
  'Longitude',
  'URL_Gambar',
  'URL_Gambar_360',
  'URL_Video',
  'Gambar_Lama',
  'Gambar_Baru'
] as const;

export const SITES_SHEET_HEADERS = [
  'NO',
  'KODE',
  'NAMA_SITUS',
  'KATEGORI',
  'KLASIFIKASI',
  'KELURAHAN',
  'KECAMATAN',
  'KABUPATEN',
  'PROVINSI',
  'ALAMAT',
  'LATITUDE',
  'LONGITUDE',
  'DESKRIPSI',
  'SEJARAH',
  'PERIODE',
  'STATUS_PENETAPAN',
  'NO_SK',
  'TANGGAL_SK',
  'TINGKAT_SK',
  'PEMILIK',
  'JURU_PELIHARA',
  'KONDISI_FISIK',
  'BAHAN_MATERIAL',
  'UKURAN_LUAS',
  'FOTO_UTAMA',
  'FOTO_GALLERY_1',
  'FOTO_GALLERY_2',
  'FOTO_GALLERY_3',
  'VIDEO_VIRTUAL_TOUR',
  'AUDIO_NARASI',
  'JAM_BUKA',
  'TIKET_MASUK',
  'FASILITAS',
  'AKSESIBILITAS',
  'TAGS',
  'SUMBER_REFERENSI',
  'TERAKHIR_DIPERBARUI'
] as const;
