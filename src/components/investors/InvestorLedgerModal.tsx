import React, { useState, useMemo } from 'react';
import { Investor, Project, DispatchTransaction, InvestorPayout } from '@/types/database';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { PricePerVolCell } from '@/components/ui/PricePerVolCell';
import { formatDateID } from '@/lib/dateSearchUtils';
import { calculateInvestorFinancials } from '@/lib/investorFinanceUtils';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { X } from 'lucide-react';

interface InvestorLedgerModalProps {
  investor: Investor;
  projects: Project[];
  transactions: DispatchTransaction[];
  payouts: InvestorPayout[];
  onClose: () => void;
  onRecordPayout: (payload: { amount: number; note: string; date?: string }) => Promise<void>;
  isInvestorUser?: boolean;
}

export function InvestorLedgerModal({
  investor,
  projects,
  transactions,
  payouts,
  onClose,
  onRecordPayout,
  isInvestorUser = false
}: InvestorLedgerModalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'ritase' | 'payout'>('ringkasan');
  const [isPayoutFormOpen, setIsPayoutFormOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutNote, setPayoutNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proyek yang didanai investor ini
  const linkedProjects = useMemo(() => {
    return projects.filter(p => p.investorId === investor.id);
  }, [projects, investor.id]);

  const linkedProjectIds = useMemo(() => {
    return new Set(linkedProjects.map(p => p.id));
  }, [linkedProjects]);

  // Seluruh transaksi ritase proyek yang didanai investor ini
  const investorTransactions = useMemo(() => {
    return transactions.filter(tx => tx.projectId && linkedProjectIds.has(tx.projectId));
  }, [transactions, linkedProjectIds]);

  // Transaksi penyerahan dividen / payout untuk investor ini
  const investorPayouts = useMemo(() => {
    return payouts.filter(p => p.investorId === investor.id);
  }, [payouts, investor.id]);

  // Kalkulasi Finansial & Bagi Hasil (Persentase & Fixed Monthly)
  const financialSummary = useMemo(() => {
    return calculateInvestorFinancials({
      investor,
      projects,
      transactions: investorTransactions,
      payouts: investorPayouts
    });
  }, [investor, projects, investorTransactions, investorPayouts]);

  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || payoutAmount <= 0) return;
    setIsSubmitting(true);
    try {
      await onRecordPayout({
        amount: payoutAmount,
        note: payoutNote.trim() || 'Penyerahan Bagi Hasil Proyek'
      });
      setPayoutAmount(0);
      setPayoutNote('');
      setIsPayoutFormOpen(false);
    } catch (err) {
      console.error('Gagal mencatat payout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full md:max-w-4xl bg-white rounded-t-[20px] md:rounded-[12px] h-[92vh] md:h-[88vh] max-h-[92vh] md:max-h-[88vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out select-text">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-[#eaeaea] flex items-center justify-between bg-[#fafafa] flex-shrink-0">
          <div className="w-full text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[10px] font-semibold bg-[#111111] text-white px-2 py-0.5 rounded">
                KARTU REKAP PEMODAL
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#111111] mt-1">
              Buku Kas & Rekap Ekuitas: {investor.name}
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Transparansi perputaran modal, performa ritase proyek yang didanai, dan riwayat penyerahan bagi hasil.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-[#555555] mt-2 pt-2 border-t border-[#eaeaea]">
              <span>
                No. WhatsApp / HP: <strong className="text-[#111111] font-mono">{investor.phoneNumber ? formatPhoneNumber(investor.phoneNumber) : '-'}</strong>
              </span>
              <span>
                Rekening Bank: <strong className="text-[#111111]">{investor.bankAccount || '-'}</strong>
              </span>
              {investor.notes && (
                <span className="text-[#777777] italic">
                  Catatan: {investor.notes}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-[#888888] hover:text-[#111111] hover:bg-[#eaeaea] transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 border-b border-[#eaeaea] bg-white">
          <div className="p-3 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px]">
            <span className="text-[10px] text-[#888888] uppercase font-semibold block">Modal Awal Disetor</span>
            <span className="text-sm sm:text-base font-bold tracking-tight text-[#111111] block mt-1">
              {formatRupiah(investor.initialCapital || 0)}
            </span>
            <span className="text-[10px] text-[#666666] block mt-0.5">
              {linkedProjects.length} Proyek Didanai
            </span>
          </div>

          <div className="p-3 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px]">
            <span className="text-[10px] text-[#888888] uppercase font-semibold block">Total Ritase Jalan</span>
            <span className="text-sm sm:text-base font-bold tracking-tight text-[#111111] block mt-1">
              {financialSummary.totalTrips} Rit ({financialSummary.totalVolume} DT)
            </span>
            <span className="text-[10px] text-[#666666] block mt-0.5">
              Omzet: {formatRupiah(financialSummary.totalRevenue)}
            </span>
          </div>

          <div className="p-3 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px]">
            <span className="text-[10px] text-[#888888] uppercase font-semibold block">Hak Bagi Hasil Akumulasi</span>
            <span className="text-sm sm:text-base font-bold tracking-tight text-[#008060] block mt-1">
              {formatRupiah(financialSummary.totalProfitShareEarned)}
            </span>
            <span className="text-[10px] text-[#666666] block mt-0.5">
              Dari Laba Bersih Proyek
            </span>
          </div>

          <div className="p-3 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px]">
            <span className="text-[10px] text-[#888888] uppercase font-semibold block">Sisa Bagi Hasil Belum Ditarik</span>
            <span className={`text-sm sm:text-base font-bold tracking-tight block mt-1 ${
              financialSummary.remainingProfitShare > 0 ? 'text-[#008060]' : 'text-[#888888]'
            }`}>
              {formatRupiah(financialSummary.remainingProfitShare)}
            </span>
            <span className="text-[10px] text-[#666666] block mt-0.5">
              Sudah Ditarik: {formatRupiah(financialSummary.totalPayoutWithdrawn)}
            </span>
          </div>
        </div>

        {/* Tab Navigasi */}
        <div className="flex items-center gap-2 px-4 sm:px-5 border-b border-[#eaeaea] bg-[#fafafa]">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ringkasan'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            Ringkasan Proyek & Alokasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ritase')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ritase'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            Riwayat Ritase ({financialSummary.totalTrips})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payout')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'payout'
                ? 'border-[#111111] text-[#111111]'
                : 'border-transparent text-[#666666] hover:text-[#111111]'
            }`}
          >
            Penyerahan Bagi Hasil ({investorPayouts.length})
          </button>
        </div>

        {/* Konten Tab */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'ringkasan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111111]">
                  Daftar Proyek yang Didanai ({financialSummary.breakdown.length})
                </span>
                <span className="text-[11px] text-[#666666]">
                  Biaya operasional dari Kas Utama, hak dihitung dari laba bersih ritase atau nominal tetap bulanan
                </span>
              </div>

              {financialSummary.breakdown.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#888888] bg-[#f5f5f5] rounded-[8px]">
                  Belum ada proyek yang dikaitkan ke investor ini. Edit data investor untuk mengaitkan proyek.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {financialSummary.breakdown.map((item, idx) => {
                    const linkedProj = linkedProjects.find(p => p.id === item.projectId);
                    const projTxs = investorTransactions.filter(tx => tx.projectId === item.projectId);
                    const isFixed = item.scheme === 'FIXED_MONTHLY';

                    return (
                      <div key={item.projectId || idx} className="p-3.5 bg-[#f9f9f9] rounded-[8px] space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-[#111111] block">{item.projectName}</span>
                            <span className="text-[10px] text-[#888888] block">{linkedProj?.location || 'Portofolio Umum'}</span>
                          </div>
                          {isFixed ? (
                            <span className="text-[10px] font-bold bg-[#0284c7] text-white px-2.5 py-0.5 rounded-full border-none whitespace-nowrap flex-shrink-0">
                              Fixed: {formatRupiah(item.fixedAmount || 0)}/bln (Tgl {item.dueDay || 25})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-[#15803d] text-white px-2.5 py-0.5 rounded-full border-none whitespace-nowrap flex-shrink-0">
                              Bagi Hasil: {item.percentage || 50}%
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#eaeaea] grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[#888888] block text-[10px]">Alokasi Modal Pokok:</span>
                            <span className="font-bold tracking-tight text-[#111111]">
                              {formatRupiah(linkedProj?.initialDeposit || (item.projectId === 'GLOBAL' ? investor.initialCapital || 0 : 0))}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#888888] block text-[10px]">Total Ritase Berjalan:</span>
                            <span className="font-bold tracking-tight text-[#111111]">
                              {item.projectId === 'GLOBAL' ? financialSummary.totalTrips : projTxs.length} Rit
                            </span>
                          </div>

                          {isFixed ? (
                            <>
                              <div>
                                <span className="text-[#888888] block text-[10px]">Periode Jatuh Tempo:</span>
                                <span className="font-bold tracking-tight text-[#111111]">
                                  {item.periods || 0} Bulan Terlewati
                                </span>
                              </div>
                              <div>
                                <span className="text-[#888888] block text-[10px]">Jatuh Tempo Berikutnya:</span>
                                <span className="font-bold tracking-tight text-[#666666]">
                                  {item.nextDueDate ? formatDateID(item.nextDueDate) : '-'}
                                </span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-[#f0f0f0] flex items-center justify-between">
                                <span className="text-[#888888] text-[10px]">Hak Dividen Terkumpul:</span>
                                <span className="font-bold tracking-tight text-[#008060] text-xs">
                                  {formatRupiah(item.totalEarned || 0)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-[#888888] block text-[10px]">Laba Bersih Proyek:</span>
                                <span className={`font-bold tracking-tight ${(item.netProfitRitase || 0) >= 0 ? 'text-[#111111]' : 'text-red-600'}`}>
                                  {formatRupiah(item.netProfitRitase || 0)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#888888] block text-[10px]">Porsi Hak Investor:</span>
                                <span className="font-bold tracking-tight text-[#008060]">
                                  {formatRupiah(item.totalEarned || 0)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ritase' && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-2.5">No. Tiket / Tgl</th>
                      <th className="py-2 px-2.5">Armada / Sopir</th>
                      <th className="py-2 px-2.5">Proyek Tujuan</th>
                      <th className="py-2 px-2.5">Material & Vol</th>
                      <th className="py-2 px-2.5 text-right">Harga Beli</th>
                      <th className="py-2 px-2.5 text-right">Harga Jual</th>
                      <th className="py-2 px-2.5 text-right">Biaya (Kas Utama)</th>
                      <th className="py-2 px-2.5 text-right">Laba Bersih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeaea]">
                    {investorTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#888888]">
                          Belum ada transaksi ritase untuk proyek yang didanai investor ini.
                        </td>
                      </tr>
                    ) : (
                      investorTransactions.map(tx => {
                        const expense = (tx.totalBuyCost || 0) + (tx.operationalCost || 0);
                        const profit = (tx.totalRevenue || 0) - expense;
                        return (
                          <tr key={tx.id} className="hover:bg-[#fafafa]">
                            <td className="py-2 px-2.5">
                              <span className="font-mono font-medium text-[#111111] block">{tx.ticketNumber}</span>
                              <span className="text-[10px] text-[#888888] block">{formatDateID(tx.deliveryDate || tx.date)}</span>
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="font-bold text-[#111111] block">{tx.truckPlate}</span>
                              <span className="text-[10px] text-[#888888] block">{tx.driverName || 'Supir'}</span>
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="text-[#111111] block font-medium truncate max-w-[140px]">{tx.projectName}</span>
                              <span className="text-[10px] text-[#888888] block">{tx.clientName}</span>
                            </td>
                            <td className="py-2 px-2.5">
                              <span className="text-[#111111] block font-medium">{tx.materialName}</span>
                              <span className="text-[10px] text-[#888888] block">{tx.quantity} {tx.unit}</span>
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <PricePerVolCell
                                unitPrice={tx.buyPricePerUnit}
                                totalPrice={tx.totalBuyCost}
                                unit={tx.unit}
                                quantity={tx.quantity}
                                align="right"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-right">
                              <PricePerVolCell
                                unitPrice={tx.sellPricePerUnit}
                                totalPrice={tx.totalRevenue}
                                unit={tx.unit}
                                quantity={tx.quantity}
                                align="right"
                              />
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold tracking-tight text-[#666666]">
                              {formatRupiah(expense)}
                            </td>
                            <td className={`py-2 px-2.5 text-right font-bold tracking-tight ${profit >= 0 ? 'text-[#008060]' : 'text-red-600'}`}>
                              {formatRupiah(profit)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payout' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#111111] block">
                    Riwayat Penyerahan Bagi Hasil / Dividen
                  </span>
                  <span className="text-[11px] text-[#666666] block">
                    Setiap penyerahan bagi hasil otomatis memotong saldo Kas Utama PT Patak
                  </span>
                </div>

                {!isInvestorUser && !isPayoutFormOpen && (
                  <button
                    type="button"
                    onClick={() => setIsPayoutFormOpen(true)}
                    className="px-3 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer"
                  >
                    + Penyerahan Bagi Hasil
                  </button>
                )}
              </div>

              {/* Form Input Payout */}
              {isPayoutFormOpen && (
                <form onSubmit={handlePayoutSubmit} className="p-3.5 bg-[#fcfcfc] border border-[#eaeaea] rounded-[8px] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#eaeaea]">
                    <span className="text-xs font-bold text-[#111111]">Form Penyerahan Bagi Hasil</span>
                    <button
                      type="button"
                      onClick={() => setIsPayoutFormOpen(false)}
                      className="text-[#888888] hover:text-[#111111] text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#333333] font-semibold mb-1">
                        Nominal Bagi Hasil (Rp) <span className="text-red-500">*</span>
                      </label>
                      <CurrencyInput
                        value={payoutAmount}
                        onChange={setPayoutAmount}
                        placeholder="0"
                        variant="solid-white"
                      />
                      {financialSummary.remainingProfitShare > 0 && (
                        <div className="text-[10px] text-[#666666] mt-1 flex justify-between">
                          <span>Sisa Hak Belum Ditarik:</span>
                          <button
                            type="button"
                            onClick={() => setPayoutAmount(financialSummary.remainingProfitShare)}
                            className="font-bold text-[#008060] underline cursor-pointer"
                          >
                            Tarik Penuh ({formatRupiah(financialSummary.remainingProfitShare)})
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[#333333] font-semibold mb-1">
                        Catatan / Keterangan Penyerahan
                      </label>
                      <input
                        type="text"
                        value={payoutNote}
                        onChange={e => setPayoutNote(e.target.value)}
                        placeholder="Bagi hasil termin 1 proyek Cikedal via transfer BCA..."
                        className="w-full bg-white border border-[#eaeaea] rounded-[6px] px-3 py-2 text-xs text-[#111111] outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPayoutFormOpen(false)}
                      className="px-3 py-1.5 border border-[#eaeaea] text-[#666666] text-xs rounded cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || payoutAmount <= 0}
                      className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan & Potong Kas Utama'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tabel Riwayat Payout */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f9f9f9] border-b border-[#eaeaea] text-[#666666] font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Keterangan / Catatan</th>
                      <th className="py-2 px-3">Dicatat Oleh</th>
                      <th className="py-2 px-3 text-right">Nominal Payout (Kas Keluar)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeaea]">
                    {investorPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-[#888888]">
                          Belum ada riwayat penyerahan bagi hasil untuk investor ini.
                        </td>
                      </tr>
                    ) : (
                      investorPayouts.map(p => (
                        <tr key={p.id} className="hover:bg-[#fafafa]">
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-medium text-[#111111]">
                            {formatDateID(p.date)}
                          </td>
                          <td className="py-2.5 px-3 text-[#333333]">
                            {p.note}
                          </td>
                          <td className="py-2.5 px-3 text-[#666666] text-[11px]">
                            {p.createdByName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold tracking-tight text-[#cf1124] whitespace-nowrap">
                            - {formatRupiah(p.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Mobile Close Bar */}
        <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end z-10 md:hidden">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-[#111111] bg-[#f0f0f0] hover:bg-[#e4e4e4] rounded-[8px] transition-colors border-none text-center cursor-pointer"
          >
            Tutup Rekap Investor
          </button>
        </div>
      </div>
    </div>
  );
}
