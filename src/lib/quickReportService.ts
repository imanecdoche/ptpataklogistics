import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaperSize, PageOrientation, TablePdfFilterSummary } from '@/lib/pdfExportService';

export interface QuickReportPdfPreferences {
  paperSize: PaperSize;
  continuousWidthPreset?: string;
  continuousWidthMm?: number;
  customWidthMm?: number;
  customHeightMm?: number;
  orientation: PageOrientation;
  marginPreset: 'compact' | 'normal' | 'wide' | 'custom';
  customMarginMm?: number;
  fontSize: number;
  columnWidths?: { [colKey: string]: number };
  showLetterhead: boolean;
  showFiltersSummary: boolean;
  showSignatures: boolean;
  showPageNumbers: boolean;
  groupByMaterial: boolean;
  preventTextWrapping: boolean;
  hiddenColumnKeys?: string[];
  customNotes?: string;
}

export interface QuickReportShortcut {
  id: string;
  name: string;
  tableId: string;
  exportType: string;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  fileName?: string;
  pdfPreferences: QuickReportPdfPreferences;
  savedFilters?: Record<string, any>;
  filtersSummary?: TablePdfFilterSummary[];
  createdAt: string;
  updatedAt: string;
  createdByEmail?: string;
}

const QUICK_REPORTS_COLLECTION = 'quick_reports';
const LOCAL_STORAGE_KEY = 'patak_quick_reports_cache';

/**
 * Membersihkan objek secara rekursif dari nilai `undefined` agar aman diterima oleh Firestore
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === undefined) return null as any;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestorePayload(item)) as any;
  }
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeFirestorePayload(value);
    }
  }
  return clean;
}

/**
 * Membaca data cache lokal offline
 */
function getLocalShortcuts(): QuickReportShortcut[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[quickReportService] Gagal membaca localStorage cache:', e);
  }
  return [];
}

/**
 * Menyimpan data cache lokal offline
 */
function saveLocalShortcuts(list: QuickReportShortcut[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[quickReportService] Gagal menulis localStorage cache:', e);
  }
}

/**
 * Real-time listener seluruh data pintasan Laporan Cepat dari Firestore dengan sinkronisasi cache lokal
 */
export function subscribeQuickReports(
  callback: (shortcuts: QuickReportShortcut[]) => void
): () => void {
  const localItems = getLocalShortcuts();
  if (localItems.length > 0) {
    callback(localItems);
  }

  const colRef = collection(db, QUICK_REPORTS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: QuickReportShortcut[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<QuickReportShortcut, 'id'>)
      }));

      // Merge dengan cache lokal (jika ada pintasan lokal yang belum tersinkron)
      const mergedMap = new Map<string, QuickReportShortcut>();
      localItems.forEach(item => mergedMap.set(item.id, item));
      list.forEach(item => mergedMap.set(item.id, item));

      const mergedList = Array.from(mergedMap.values()).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );

      saveLocalShortcuts(mergedList);
      callback(mergedList);
    },
    err => {
      console.warn('[quickReportService] Gagal membaca data quick_reports dari Firestore, menggunakan cache lokal:', err);
      callback(getLocalShortcuts());
    }
  );
}

/**
 * Mengambil seluruh pintasan laporan sekali baca
 */
export async function getQuickReports(): Promise<QuickReportShortcut[]> {
  try {
    const colRef = collection(db, QUICK_REPORTS_COLLECTION);
    const snap = await getDocs(query(colRef, orderBy('createdAt', 'desc')));
    const list = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<QuickReportShortcut, 'id'>)
    }));
    saveLocalShortcuts(list);
    return list;
  } catch (e) {
    console.warn('[quickReportService] Fallback ke cache lokal:', e);
    return getLocalShortcuts();
  }
}

/**
 * Membuat pintasan laporan cepat baru di Firestore dengan pembersihan null-safety mutlak
 */
export async function createQuickReportShortcut(
  data: Omit<QuickReportShortcut, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const newId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  const shortcutData: QuickReportShortcut = {
    id: newId,
    name: data.name || 'Laporan Baru',
    tableId: data.tableId || 'general',
    exportType: data.exportType || data.tableId || 'general',
    categoryLabel: data.categoryLabel || 'Laporan Umum',
    title: data.title || data.name || 'Laporan',
    subtitle: data.subtitle || '',
    fileName: data.fileName || '',
    pdfPreferences: {
      paperSize: data.pdfPreferences?.paperSize || 'a4',
      continuousWidthPreset: data.pdfPreferences?.continuousWidthPreset || 'a4',
      continuousWidthMm: data.pdfPreferences?.continuousWidthMm || 210,
      customWidthMm: data.pdfPreferences?.customWidthMm || 210,
      customHeightMm: data.pdfPreferences?.customHeightMm || 297,
      orientation: data.pdfPreferences?.orientation || 'landscape',
      marginPreset: data.pdfPreferences?.marginPreset || 'normal',
      customMarginMm: data.pdfPreferences?.customMarginMm || 10,
      fontSize: data.pdfPreferences?.fontSize || 7.2,
      columnWidths: data.pdfPreferences?.columnWidths || {},
      showLetterhead: data.pdfPreferences?.showLetterhead ?? true,
      showFiltersSummary: data.pdfPreferences?.showFiltersSummary ?? true,
      showSignatures: data.pdfPreferences?.showSignatures ?? true,
      showPageNumbers: data.pdfPreferences?.showPageNumbers ?? true,
      groupByMaterial: data.pdfPreferences?.groupByMaterial ?? true,
      preventTextWrapping: data.pdfPreferences?.preventTextWrapping ?? true,
      hiddenColumnKeys: data.pdfPreferences?.hiddenColumnKeys || [],
      customNotes: data.pdfPreferences?.customNotes || ''
    },
    savedFilters: data.savedFilters || {},
    filtersSummary: data.filtersSummary || [],
    createdAt: now,
    updatedAt: now,
    createdByEmail: data.createdByEmail || ''
  };

  // Bersihkan setiap kemungkinan nilai undefined
  const cleanedPayload = sanitizeFirestorePayload(shortcutData);

  // Simpan ke cache lokal terlebih dahulu agar UX instan & data tidak pernah hilang
  const localList = getLocalShortcuts();
  localList.unshift(shortcutData);
  saveLocalShortcuts(localList);

  // Sinkronisasikan ke Cloud Firestore
  try {
    const docRef = doc(db, QUICK_REPORTS_COLLECTION, newId);
    await setDoc(docRef, cleanedPayload);
  } catch (firestoreErr) {
    console.warn('[quickReportService] Gagal sync ke Cloud Firestore, data tetap aman di cache lokal:', firestoreErr);
  }

  return newId;
}

/**
 * Memperbarui konfigurasi pintasan laporan cepat
 */
export async function updateQuickReportShortcut(
  id: string,
  data: Partial<Omit<QuickReportShortcut, 'id' | 'createdAt'>>
): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload = sanitizeFirestorePayload({
    ...data,
    updatedAt: now
  });

  // Update di cache lokal
  const localList = getLocalShortcuts().map(item =>
    item.id === id ? { ...item, ...data, updatedAt: now } : item
  );
  saveLocalShortcuts(localList);

  // Update di Cloud Firestore
  try {
    const docRef = doc(db, QUICK_REPORTS_COLLECTION, id);
    await updateDoc(docRef, updatePayload);
  } catch (firestoreErr) {
    console.warn('[quickReportService] Gagal update di Cloud Firestore:', firestoreErr);
  }
}

/**
 * Menghapus pintasan laporan cepat dari Firestore dan cache lokal
 */
export async function deleteQuickReportShortcut(id: string): Promise<void> {
  // Hapus dari cache lokal
  const localList = getLocalShortcuts().filter(item => item.id !== id);
  saveLocalShortcuts(localList);

  // Hapus dari Firestore
  try {
    const docRef = doc(db, QUICK_REPORTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (firestoreErr) {
    console.warn('[quickReportService] Gagal delete di Cloud Firestore:', firestoreErr);
  }
}
