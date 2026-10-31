import React, { useState, useEffect } from 'react';
import {
  TicketApprovalRequest
} from '@/types/database';
import {
  subscribePendingApprovals,
  subscribeAllApprovals,
  approveRequest,
  rejectRequest
} from '@/lib/approvalService';
import { formatRupiah } from '@/lib/currencyUtils';

interface ApprovalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserName: string;
}

export function ApprovalCenterModal({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserName
}: ApprovalCenterModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingRequests, setPendingRequests] = useState<TicketApprovalRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TicketApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject Dialog State
  const [rejectTarget, setRejectTarget] = useState<TicketApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Subscribe real-time
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);

    const unsubPending = subscribePendingApprovals(list => {
      setPendingRequests(list);
      setIsLoading(false);
    });

    const unsubAll = subscribeAllApprovals(list => {
      setAllRequests(list);
    });

    return () => {
      unsubPending();
      unsubAll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const historyRequests = allRequests.filter(r => r.status !== 'PENDING');

  const handleApprove = async (request: TicketApprovalRequest) => {
    const confirmText =
      request.type === 'DELETE'
        ? `Konfirmasi ACC Penghapusan Tiket #${request.ticketNumber}?\n\nPERINGATAN: Tiket ini dan catatan mutasi kas terkait akan dihapus secara permanen.`
        : `Konfirmasi ACC Koreksi Tiket #${request.ticketNumber}?\n\nData transaksi dan mutasi kas akan langsung diperbarui sesuai usulan.`;

    if (!window.confirm(confirmText)) return;

    setProcessingId(request.id);
    try {
      await approveRequest(request, currentUserEmail, currentUserName);
    } catch (err) {
      console.error('Gagal menyetujui pengajuan:', err);
      alert('Gagal mengeksekusi persetujuan. Silakan periksa koneksi internet.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await rejectRequest(
        rejectTarget.id,
        currentUserEmail,
        currentUserName,
        rejectionReason.trim()
      );
      setRejectTarget(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Gagal menolak pengajuan:', err);
      alert('Gagal menolak pengajuan.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div 
          className="relative w-full md:max-w-3xl bg-white rounded-t-[20px] md:rounded-[16px] shadow-2xl flex flex-col h-[92vh] md:h-[88vh] max-h-[92vh] md:max-h-[88vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 ease-out"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#eaeaea] bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#111111] text-white flex items-center justify-center font-bold text-sm">
                ACC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#111111]">
                    Pusat Persetujuan Tiket (Approval Center)
                  </h2>
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white animate-pulse">
                      {pendingRequests.length} Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#666666] mt-0.5">
                  Tinjau dan setujui pengajuan koreksi atau penghapusan tiket ritase dari Dispatcher.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-[#888888] hover:text-[#111111] p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="px-5 pt-3 pb-0 border-b border-[#eaeaea] flex items-center gap-4 bg-[#fafafa] flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'pending'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Menunggu Persetujuan</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  pendingRequests.length > 0
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-[#e5e5e5] text-[#777777]'
                }`}
              >
                {pendingRequests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Riwayat Pengajuan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#e5e5e5] text-[#777777]">
                {historyRequests.length}
              </span>
            </button>
          </div>

          {/* List Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f8f8f8]">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#888888] flex flex-col items-center gap-2">
                <span className="w-5 h-5 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                <span>Memuat daftar pengajuan...</span>
              </div>
            ) : activeTab === 'pending' ? (
              pendingRequests.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#888888] space-y-2">
                  <div className="text-3xl">🎉</div>
                  <p className="font-bold text-[#111111]">Tidak Ada Pengajuan Pending</p>
                  <p>Semua permohonan koreksi atau penghapusan tiket telah diproses.</p>
                </div>
              ) : (
                pendingRequests.map(req => {
                  const isProcessing = processingId === req.id;
                  const isDelete = req.type === 'DELETE';

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#e5e5e5] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3.5 transition-all hover:border-[#cccccc]"
                    >
                      {/* Request Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f0f0f0]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-[6px] tracking-wide ${
                              isDelete
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isDelete ? 'PERMOHONAN HAPUS' : 'PERMOHONAN KOREKSI'}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#111111]">
                            #{req.ticketNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#777777]">
                          Diajukan oleh <span className="font-bold text-[#111111]">{req.requestedByName}</span> ({req.requestedBy}) • {formatDateTime(req.requestedAt)}
                        </div>
                      </div>

                      {/* Alasan Pemohon */}
                      <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-[8px] space-y-1">
                        <span className="text-[10px] font-bold tracking-wider text-[#888888] uppercase block">
                          Alasan Pengajuan
                        </span>
                        <p className="text-xs text-[#111111] font-medium leading-relaxed">
                          "{req.reason}"
                        </p>
                      </div>

                      {/* Detail / Komparasi Data */}
                      {isDelete ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-red-50/40 p-3 rounded-[8px] border border-red-100">
                          <div>
                            <span className="text-[10px] text-[#777777] block">Tanggal</span>
                            <span className="font-medium text-[#111111]">{req.currentData.deliveryDate || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] block">Armada & Sopir</span>
                            <span className="font-medium text-[#111111]">
                              {req.currentData.truckPlate} {req.currentData.driverName ? `(${req.currentData.driverName})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] block">Material & Muatan</span>
                            <span className="font-medium text-[#111111]">
                              {req.currentData.materialName} ({req.currentData.quantity} {req.currentData.unit})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#777777] block">Total Omset</span>
                            <span className="font-bold text-[#111111]">{formatRupiah(req.currentData.totalRevenue || 0)}</span>
                          </div>
                        </div>
                      ) : (
                        /* Edit Comparison Box */
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold tracking-wider text-[#888888] uppercase block">
                            Perubahan yang Diajukan
                          </span>
                          <div className="overflow-x-auto border border-[#eaeaea] rounded-[8px]">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-[#f5f5f5] text-[#666666] border-b border-[#eaeaea]">
                                  <th className="py-2 px-3 font-semibold">Atribut</th>
                                  <th className="py-2 px-3 font-semibold text-[#888888]">Nilai Asli</th>
                                  <th className="py-2 px-3 font-semibold text-[#111111]">Nilai Diajukan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f0f0f0] bg-white">
                                {req.proposedData && Object.keys(req.proposedData).map(key => {
                                  const orig = (req.currentData as Record<string, unknown>)[key];
                                  const prop = (req.proposedData as Record<string, unknown>)[key];
                                  if (orig === prop || prop === undefined) return null;

                                  const formatVal = (v: unknown) => {
                                    if (v === null || v === undefined || v === '') return '-';
                                    if (typeof v === 'number' && (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('revenue'))) {
                                      return formatRupiah(v);
                                    }
                                    return String(v);
                                  };

                                  return (
                                    <tr key={key} className="hover:bg-amber-50/20">
                                      <td className="py-1.5 px-3 font-medium text-[#555555] whitespace-nowrap capitalize">
                                        {key.replace(/([A-Z])/g, ' $1')}
                                      </td>
                                      <td className="py-1.5 px-3 text-[#888888] line-through">
                                        {formatVal(orig)}
                                      </td>
                                      <td className="py-1.5 px-3 font-bold text-emerald-700 bg-emerald-50/40">
                                        {formatVal(prop)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f0f0]">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(req);
                            setRejectionReason('');
                          }}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 text-xs font-semibold text-[#cf1124] bg-white border border-[#cf1124]/30 hover:bg-red-50 rounded-[8px] transition-colors cursor-pointer"
                        >
                          ✕ Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(req)}
                          disabled={isProcessing}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-[8px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {isProcessing ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Memproses...</span>
                            </>
                          ) : (
                            <>
                              <span>✓</span>
                              <span>Setujui (ACC)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Tab Riwayat */
              historyRequests.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#888888]">
                  Belum ada riwayat persetujuan atau penolakan tiket.
                </div>
              ) : (
                historyRequests.map(req => {
                  const isApproved = req.status === 'APPROVED';
                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#eaeaea] rounded-[10px] p-4 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isApproved ? 'DISETUJUI (ACC)' : 'DITOLAK'}
                          </span>
                          <span className="font-mono font-bold text-[#111111]">
                            #{req.ticketNumber} ({req.type})
                          </span>
                        </div>
                        <span className="text-[11px] text-[#888888]">
                          {formatDateTime(req.reviewedAt)}
                        </span>
                      </div>
                      <p className="text-[#666666]">
                        <span className="font-medium text-[#111111]">Pemohon:</span> {req.requestedByName} • <span className="font-medium text-[#111111]">Alasan:</span> "{req.reason}"
                      </p>
                      {req.reviewedByName && (
                        <p className="text-[#888888] text-[11px]">
                          Diproses oleh <span className="font-bold text-[#111111]">{req.reviewedByName}</span>
                          {req.rejectionReason ? ` • Catatan: "${req.rejectionReason}"` : ''}
                        </p>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 select-none">
          <div className="bg-white rounded-[12px] p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[#111111]">
              Tolak Pengajuan Tiket #{rejectTarget.ticketNumber}
            </h3>
            <p className="text-xs text-[#666666]">
              Apakah Anda yakin ingin menolak pengajuan ini? Tiket akan tetap pada kondisi aslinya.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#555555] block">
                Catatan Penolakan (Opsional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Contoh: Bukti fisik tiket valid, silakan koordinasi ulang dengan mandor..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-[6px] border border-[#dcdcdc] focus:border-[#111111] outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeaea]">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-3 py-1.5 text-xs text-[#666666] hover:bg-[#f0f0f0] rounded-[6px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-[6px]"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
