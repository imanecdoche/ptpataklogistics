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

/**
 * Real-time listener seluruh data pintasan Laporan Cepat dari Firestore
 */
export function subscribeQuickReports(
  callback: (shortcuts: QuickReportShortcut[]) => void
): () => void {
  const colRef = collection(db, QUICK_REPORTS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: QuickReportShortcut[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<QuickReportShortcut, 'id'>)
      }));
      callback(list);
    },
    err => {
      console.warn('[quickReportService] Gagal membaca data quick_reports:', err);
    }
  );
}

/**
 * Mengambil seluruh pintasan laporan sekali baca
 */
export async function getQuickReports(): Promise<QuickReportShortcut[]> {
  const colRef = collection(db, QUICK_REPORTS_COLLECTION);
  const snap = await getDocs(query(colRef, orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<QuickReportShortcut, 'id'>)
  }));
}

/**
 * Membuat pintasan laporan cepat baru di Firestore
 */
export async function createQuickReportShortcut(
  data: Omit<QuickReportShortcut, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, QUICK_REPORTS_COLLECTION);
  const newDocRef = doc(colRef);
  const now = new Date().toISOString();

  const shortcutData: QuickReportShortcut = {
    ...data,
    id: newDocRef.id,
    createdAt: now,
    updatedAt: now
  };

  await setDoc(newDocRef, shortcutData);
  return newDocRef.id;
}

/**
 * Memperbarui konfigurasi pintasan laporan cepat
 */
export async function updateQuickReportShortcut(
  id: string,
  data: Partial<Omit<QuickReportShortcut, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, QUICK_REPORTS_COLLECTION, id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...data,
    updatedAt: now
  });
}

/**
 * Menghapus pintasan laporan cepat dari Firestore
 */
export async function deleteQuickReportShortcut(id: string): Promise<void> {
  const docRef = doc(db, QUICK_REPORTS_COLLECTION, id);
  await deleteDoc(docRef);
}
