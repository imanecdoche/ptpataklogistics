import React, { useState, useMemo } from 'react';
import { CashLedgerEntry } from '@/types/database';
import { resolveCreatorName } from '@/lib/entityResolver';
import { PayDebtModal } from './PayDebtModal';
import { RecordMutationModal } from './RecordMutationModal';

interface CashFlowViewProps {
  entries: CashLedgerEntry[];
  userEmail: string;
  onRefresh: () => void;
}

const PEI_INITIAL_DEBT = 18000000;

const formatRupiah = (val: number): string =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');

export function CashFlowView({
  entries,
  userEmail,
  onRefresh
}: CashFlowViewProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPayDebtOpen, setIsPayDebtOpen] = useState(false);
  const [isRecordMutationOpen, setIsRecordMutationOpen] = useState(false);

  // Kalkulasi Hutang Bpk. Pei
  const peiDebtPayments = useMemo(() => {
    return entries
      .filter(
        e =>
          !e.isCredit &&
          (e.type === 'CICILAN_HUTANG' ||
            e.description.toLowerCase().includes('pei') ||
            e.referenceId === 'HUTANG-PT-PEI')
      )
      .reduce((acc, cur) => acc + (cur.amount || 0), 0);
  }, [entries]);

  const remainingPeiDebt = Math.max(0, PEI_INITIAL_DEBT - peiDebtPayments);
  const isPeiDebtSettled = remainingPeiDebt === 0;

  // Kalkulasi Ringkasan Kas
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    entries.forEach(e => {
      if (e.isCredit) {
        totalIn += e.amount || 0;
      } else {
        totalOut += e.amount || 0;
      }
    });
    const latestBalance = entries[0]?.runningBalance ?? 0;
    return { totalIn, totalOut, currentBalance: latestBalance };
  }, [entries]);

  // Filter Search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      e =>
        e.description.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        (e.referenceId && e.referenceId.toLowerCase().includes(q)) ||
        (e.createdByName && e.createdByName.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 1. Metric Cards Ringkasan Arus Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Saldo Kas Riil Berjalan
          </span>
          <span
            className={`text-xl font-bold tracking-tight block mt-1 ${
              summary.currentBalance < 0 ? 'text-[#cf1124]' : 'text-emerald-700'
            }`}
          >
            {formatRupiah(summary.currentBalance)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Akumulasi bersih saldo buku kas fisik / bank
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Total Kas Masuk
          </span>
          <span className="text-xl font-bold tracking-tight text-emerald-700 block mt-1">
            {formatRupiah(summary.totalIn)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Modal disetor, pelunasan termin & top-up
          </span>
        </div>

        <div className="bg-white border border-[#eaeaea] rounded-[8px] p-3.5">
          <span className="text-[11px] text-[#888888] font-medium block">
            Total Kas Keluar
          </span>
          <span className="text-xl font-bold tracking-tight text-[#cf1124] block mt-1">
            {formatRupiah(summary.totalOut)}
          </span>
          <span className="text-[10px] text-[#888888] block mt-0.5">
            Belanja material, HOK supir/solar & operasional
          </span>
        </div>
      </div>

      {/* 2. Kartu Liabilitas Khusus: Hutang Perseroan Bpk. Pei (Rule 104) */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#f0f0f0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111111]">
                Kartu Kewajiban / Hutang Perseroan — Bpk. Pei
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isPeiDebtSettled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPeiDebtSettled ? 'LUNAS' : 'BELUM LUNAS'}
              </span>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Pinjaman modal usaha pihak ketiga kepada PT Patak Abadi Jaya (Hutang Korporasi, non-ritase)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPayDebtOpen(true)}
            disabled={isPeiDebtSettled}
            className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap self-start sm:self-center"
          >
            + Bayar / Cicil Hutang Pak Pei
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div>
            <span className="text-[11px] text-[#888888] block">Hutang Pokok Awal</span>
            <span className="text-base font-bold tracking-tight text-[#111111] block mt-0.5">
              {formatRupiah(PEI_INITIAL_DEBT)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#888888] block">Total Cicilan Terbayar</span>
            <span className="text-base font-bold tracking-tight text-emerald-700 block mt-0.5">
              {formatRupiah(peiDebtPayments)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#888888] block">Sisa Kewajiban Hutang</span>
            <span
              className={`text-base font-bold tracking-tight block mt-0.5 ${
                remainingPeiDebt > 0 ? 'text-[#cf1124]' : 'text-emerald-700'
              }`}
            >
              {formatRupiah(remainingPeiDebt)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tabel Mutasi Buku Kas Riil */}
      <div className="bg-white border border-[#eaeaea] rounded-[10px] overflow-hidden">
        {/* Toolbar Baris Atas */}
        <div className="p-3.5 border-b border-[#eaeaea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#fafafa]">
          <div className="text-xs text-[#666666]">
            Riwayat lengkap keluar masuk kas riil dan pergerakan saldo berjalan.
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input (Rule 98) */}
            <div className="relative flex-1 sm:w-64">
              <img
                src="/icons/search.png"
                alt="Search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain pointer-events-none opacity-60"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi, deskripsi, ref..."
                className="w-full bg-white border border-[#eaeaea] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#999999] outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsRecordMutationOpen(true)}
              className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer whitespace-nowrap"
            >
              + Catat Mutasi Kas Manual
            </button>
          </div>
        </div>

        {/* Tabel Data Mutasi */}
        <div className="overflow-x-auto select-text">
          <table className="w-full min-w-[950px] table-fixed text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f9f9f9] border-b border-[#eaeaea] text-[#555555] font-semibold text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-[120px] whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-3 w-[160px] whitespace-nowrap">Kategori Mutasi</th>
                <th className="py-2.5 px-3 w-[260px] whitespace-nowrap">Deskripsi / Referensi</th>
                <th className="py-2.5 px-3 w-[130px] text-right whitespace-nowrap">Kas Masuk (+)</th>
                <th className="py-2.5 px-3 w-[130px] text-right whitespace-nowrap">Kas Keluar (-)</th>
                <th className="py-2.5 px-3 w-[150px] text-right whitespace-nowrap">Saldo Berjalan</th>
                <th className="py-2.5 px-3 w-[105px] whitespace-nowrap">Dibuat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#888888]">
                    Tidak ada catatan mutasi kas yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(e => (
                  <tr key={e.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#555555] whitespace-nowrap align-middle">
                      {e.date ? e.date.slice(0, 10) : '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                      <span className="font-semibold text-[#111111] block">
                        {e.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#333333] align-middle">
                      <span className="block font-medium truncate">{e.description}</span>
                      {e.referenceId ? (
                        <span className="text-[10px] font-mono text-[#888888] block">
                          Ref: {e.referenceId}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 font-bold tracking-tight text-emerald-700 text-right whitespace-nowrap align-middle">
                      {e.isCredit ? formatRupiah(e.amount) : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold tracking-tight text-[#cf1124] text-right whitespace-nowrap align-middle">
                      {!e.isCredit ? formatRupiah(e.amount) : '-'}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-bold tracking-tight text-right whitespace-nowrap align-middle ${
                        e.runningBalance < 0 ? 'text-[#cf1124]' : 'text-[#111111]'
                      }`}
                    >
                      {formatRupiah(e.runningBalance)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#111111] whitespace-nowrap align-middle">
                      {resolveCreatorName(e.createdByName)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Bayar Hutang Pak Pei */}
      <PayDebtModal
        isOpen={isPayDebtOpen}
        onClose={() => setIsPayDebtOpen(false)}
        remainingDebt={remainingPeiDebt}
        currentCashBalance={summary.currentBalance}
        userEmail={userEmail}
        onSuccess={onRefresh}
      />

      {/* Modal Catat Mutasi Kas Manual */}
      <RecordMutationModal
        isOpen={isRecordMutationOpen}
        onClose={() => setIsRecordMutationOpen(false)}
        userEmail={userEmail}
        onSuccess={onRefresh}
      />
    </div>
  );
}
