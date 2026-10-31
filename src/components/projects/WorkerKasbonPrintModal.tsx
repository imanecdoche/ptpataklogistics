import React, { useRef } from 'react';
import { ProjectSubJob, WorkerKasbonLog } from '@/types/database';
import { formatRupiah } from '@/lib/currencyUtils';

interface WorkerKasbonPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  clientName?: string;
  subJobs: ProjectSubJob[];
  kasbonLogs: WorkerKasbonLog[];
}

export function WorkerKasbonPrintModal({
  isOpen,
  onClose,
  projectName,
  clientName,
  subJobs,
  kasbonLogs
}: WorkerKasbonPrintModalProps): React.JSX.Element | null {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalContract = subJobs.reduce((acc, s) => acc + (s.contractAmountWorker || 0), 0);
  const totalKasbon = subJobs.reduce((acc, s) => acc + (s.totalKasbonPaid || 0), 0);
  const totalRemaining = Math.max(0, totalContract - totalKasbon);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none print:p-0 print:bg-white print:static">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-[12px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden print:max-h-none print:shadow-none print:rounded-none print:w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Toolbar (Disembunyikan saat diprint) */}
        <div className="p-4 border-b border-[#eaeaea] bg-[#fafafa] flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-base">🖨️</span>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Cetak Lembar Rekapitulasi Kasbon & Upah Mandor
              </h3>
              <p className="text-[11px] text-[#666666]">
                Format siap cetak fisik atau export PDF untuk lampiran verifikasi lapangan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-[6px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>🖨️</span>
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#666666] hover:bg-[#eaeaea] rounded-[6px] transition-colors"
            >
              ✕ Tutup
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white print:p-0 print:overflow-visible text-black font-sans">
          {/* Header Dokumen */}
          <div className="border-b-2 border-black pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black tracking-wider uppercase text-black">
                  PT PATAK ABADI JAYA
                </h1>
                <p className="text-xs text-[#444444] mt-0.5 font-medium">
                  Divisi Manajemen Konstruksi, Logistik & Rekapitulasi Upah Lapangan
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-[11px] font-bold border border-black uppercase tracking-wider">
                  LEMBAR AUDIT KASBON MANDOR
                </span>
                <p className="text-[10px] text-[#666666] mt-1 font-mono">
                  Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 text-xs border-t border-[#dcdcdc] pt-3">
              <div>
                <span className="text-[#666666]">Proyek Induk:</span>
                <span className="font-bold text-black ml-2">{projectName}</span>
              </div>
              <div>
                <span className="text-[#666666]">Klien / Pihak Proyek:</span>
                <span className="font-bold text-black ml-2">{clientName || 'Mitra Proyek'}</span>
              </div>
            </div>
          </div>

          {/* Ringkasan Eksekutif */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-3.5 bg-[#f8f8f8] border border-[#dcdcdc] rounded-[6px] print:bg-white print:border-black">
            <div>
              <span className="text-[10px] font-bold text-[#666666] uppercase block">Total Nilai Kontrak Borongan</span>
              <span className="text-base font-black font-mono text-black">{formatRupiah(totalContract)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#666666] uppercase block">Total Kasbon yang Sudah Diambil</span>
              <span className="text-base font-black font-mono text-[#cf1124]">{formatRupiah(totalKasbon)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#666666] uppercase block">Sisa Hak Upah Belum Terbayar</span>
              <span className="text-base font-black font-mono text-[#008060]">{formatRupiah(totalRemaining)}</span>
            </div>
          </div>

          {/* TABEL 1: DAFTAR SUB-PEKERJAAN FISIK */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
              <span>1. Daftar Sub-Pekerjaan & Plafon Kontrak Borongan</span>
            </h2>
            <table className="w-full text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-[#f0f0f0] border-b border-black text-[10px] uppercase font-bold text-black">
                  <th className="py-2 px-2.5 border-r border-black text-center w-8">No</th>
                  <th className="py-2 px-2.5 border-r border-black text-left">Nama Pekerjaan</th>
                  <th className="py-2 px-2.5 border-r border-black text-left">Mandor / Kepala Tukang</th>
                  <th className="py-2 px-2.5 border-r border-black text-center">Volume</th>
                  <th className="py-2 px-2.5 border-r border-black text-right">Nilai Borongan</th>
                  <th className="py-2 px-2.5 border-r border-black text-right">Kasbon Ditarik</th>
                  <th className="py-2 px-2.5 text-right">Sisa Upah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dcdcdc]">
                {subJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-[#888888]">
                      Belum ada sub-pekerjaan fisik yang didaftarkan.
                    </td>
                  </tr>
                ) : (
                  subJobs.map((job, idx) => (
                    <tr key={job.id} className="border-b border-[#e5e5e5]">
                      <td className="py-2 px-2.5 border-r border-black text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-2.5 border-r border-black font-bold text-black">{job.jobName}</td>
                      <td className="py-2 px-2.5 border-r border-black">{job.workerLeaderName}</td>
                      <td className="py-2 px-2.5 border-r border-black text-center font-mono">
                        {job.volume} {job.unit === 'M2' ? 'm²' : job.unit === 'M3' ? 'm³' : 'Pkt'}
                      </td>
                      <td className="py-2 px-2.5 border-r border-black text-right font-mono font-bold">
                        {formatRupiah(job.contractAmountWorker)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-black text-right font-mono text-[#cf1124] font-bold">
                        {formatRupiah(job.totalKasbonPaid)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-[#008060] font-bold">
                        {formatRupiah(job.remainingWorkerPay)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABEL 2: BUKTI CATATAN KASBON-KASBON FISIK */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
              <span>2. Rincian Penarikan Kasbon Tukang (Riwayat Bon-Bon Fisik)</span>
            </h2>
            <table className="w-full text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-[#f0f0f0] border-b border-black text-[10px] uppercase font-bold text-black">
                  <th className="py-2 px-2.5 border-r border-black text-center w-8">No</th>
                  <th className="py-2 px-2.5 border-r border-black text-center w-24">Tanggal</th>
                  <th className="py-2 px-2.5 border-r border-black text-left">Pekerjaan & Mandor</th>
                  <th className="py-2 px-2.5 border-r border-black text-right w-28">Nominal Kasbon</th>
                  <th className="py-2 px-2.5 border-r border-black text-left">Keperluan / Keterangan</th>
                  <th className="py-2 px-2.5 text-left w-24">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dcdcdc]">
                {kasbonLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-[#888888]">
                      Belum ada catatan kasbon yang diinput.
                    </td>
                  </tr>
                ) : (
                  kasbonLogs.map((bon, idx) => (
                    <tr key={bon.id} className="border-b border-[#e5e5e5]">
                      <td className="py-1.5 px-2.5 border-r border-black text-center font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-2.5 border-r border-black text-center font-mono">{bon.date}</td>
                      <td className="py-1.5 px-2.5 border-r border-black">
                        <span className="font-bold block text-black">{bon.workerLeaderName}</span>
                        <span className="text-[10px] text-[#666666]">{bon.subJobName}</span>
                      </td>
                      <td className="py-1.5 px-2.5 border-r border-black text-right font-mono font-bold text-black">
                        {formatRupiah(bon.amount)}
                      </td>
                      <td className="py-1.5 px-2.5 border-r border-black text-[#444444]">
                        {bon.note || '-'}
                      </td>
                      <td className="py-1.5 px-2.5 text-[#666666] font-mono text-[10px]">
                        {bon.recordedBy?.split('@')[0] || 'Admin'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 pt-4 mt-8 border-t border-[#dcdcdc] text-xs text-center">
            <div>
              <p className="font-bold text-black">Mengetahui & Memverifikasi,</p>
              <p className="text-[10px] text-[#666666]">Manajemen / Keuangan PT Patak Abadi Jaya</p>
              <div className="h-16" />
              <p className="font-bold text-black border-t border-black inline-block px-8 pt-1">
                ( .................................................. )
              </p>
            </div>
            <div>
              <p className="font-bold text-black">Penerima Upah Borongan,</p>
              <p className="text-[10px] text-[#666666]">Mandor Lapangan / Kepala Tukang</p>
              <div className="h-16" />
              <p className="font-bold text-black border-t border-black inline-block px-8 pt-1">
                ( .................................................. )
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
