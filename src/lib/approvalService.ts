import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  TicketApprovalRequest,
  ApprovalRequestType,
  DispatchTransaction
} from '@/types/database';
import {
  updateDispatchTransaction,
  deleteDispatchTransaction,
  UpdateDispatchPayload
} from '@/lib/dispatcherService';

const COLLECTION_NAME = 'ticket_approval_requests';

export interface SubmitApprovalPayload {
  ticketId: string;
  ticketNumber: string;
  type: ApprovalRequestType;
  reason: string;
  currentData: Partial<DispatchTransaction>;
  proposedData?: Partial<DispatchTransaction>;
  requestedBy: string;
  requestedByName: string;
}

/**
 * Mengirimkan pengajuan persetujuan (Request Approval) untuk Edit atau Hapus Tiket Ritase
 */
export async function submitApprovalRequest(payload: SubmitApprovalPayload): Promise<string> {
  const colRef = collection(db, COLLECTION_NAME);
  const now = new Date().toISOString();

  const docData: Omit<TicketApprovalRequest, 'id'> = {
    ticketId: payload.ticketId,
    ticketNumber: payload.ticketNumber,
    type: payload.type,
    status: 'PENDING',
    requestedBy: payload.requestedBy,
    requestedByName: payload.requestedByName,
    requestedAt: now,
    reason: payload.reason.trim(),
    currentData: payload.currentData,
    ...(payload.proposedData ? { proposedData: payload.proposedData } : {})
  };

  const docRef = await addDoc(colRef, docData);
  return docRef.id;
}

/**
 * Mendengarkan seluruh pengajuan yang berstatus PENDING secara realtime
 */
export function subscribePendingApprovals(
  callback: (requests: TicketApprovalRequest[]) => void
): () => void {
  const colRef = collection(db, COLLECTION_NAME);
  const q = query(
    colRef,
    where('status', '==', 'PENDING'),
    orderBy('requestedAt', 'desc')
  );

  return onSnapshot(
    q,
    snapshot => {
      const list: TicketApprovalRequest[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<TicketApprovalRequest, 'id'>)
      }));
      callback(list);
    },
    error => {
      console.warn('Gagal subscribe pending approvals:', error);
      // Fallback tanpa orderBy jika index belum selesai dibuat
      const fallbackQuery = query(colRef, where('status', '==', 'PENDING'));
      return onSnapshot(fallbackQuery, fallbackSnap => {
        const list: TicketApprovalRequest[] = fallbackSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<TicketApprovalRequest, 'id'>)
        }));
        list.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
        callback(list);
      });
    }
  );
}

/**
 * Mendengarkan seluruh pengajuan (Pending, Approved, Rejected) untuk audit trail
 */
export function subscribeAllApprovals(
  callback: (requests: TicketApprovalRequest[]) => void
): () => void {
  const colRef = collection(db, COLLECTION_NAME);
  const q = query(colRef, orderBy('requestedAt', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      const list: TicketApprovalRequest[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<TicketApprovalRequest, 'id'>)
      }));
      callback(list);
    },
    error => {
      console.warn('Gagal subscribe all approvals:', error);
      return onSnapshot(colRef, snap => {
        const list: TicketApprovalRequest[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<TicketApprovalRequest, 'id'>)
        }));
        list.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
        callback(list);
      });
    }
  );
}

/**
 * Eksekusi persetujuan (ACC):
 * - Jika DELETE: Hapus tiket dari Firestore transactions dan cash_ledger.
 * - Jika EDIT: Update data tiket di transactions dan sinkronkan cash_ledger.
 * - Tandai dokumen request menjadi status APPROVED.
 */
export async function approveRequest(
  request: TicketApprovalRequest,
  reviewerEmail: string,
  reviewerName: string
): Promise<void> {
  const now = new Date().toISOString();

  if (request.type === 'DELETE') {
    await deleteDispatchTransaction(request.ticketId, request.ticketNumber);
  } else if (request.type === 'EDIT' && request.proposedData) {
    const payload = request.proposedData as unknown as UpdateDispatchPayload;
    await updateDispatchTransaction(
      request.ticketId,
      request.ticketNumber,
      payload,
      reviewerEmail
    );
  }

  const docRef = doc(db, COLLECTION_NAME, request.id);
  await updateDoc(docRef, {
    status: 'APPROVED',
    reviewedBy: reviewerEmail,
    reviewedByName: reviewerName,
    reviewedAt: now
  });
}

/**
 * Menolak pengajuan (REJECT):
 * - Status request berubah menjadi REJECTED dengan alasan penolakan opsional.
 * - Data tiket ritase tetap utuh tanpa perubahan.
 */
export async function rejectRequest(
  requestId: string,
  reviewerEmail: string,
  reviewerName: string,
  rejectionReason?: string
): Promise<void> {
  const now = new Date().toISOString();
  const docRef = doc(db, COLLECTION_NAME, requestId);

  await updateDoc(docRef, {
    status: 'REJECTED',
    reviewedBy: reviewerEmail,
    reviewedByName: reviewerName,
    reviewedAt: now,
    rejectionReason: rejectionReason?.trim() || ''
  });
}
