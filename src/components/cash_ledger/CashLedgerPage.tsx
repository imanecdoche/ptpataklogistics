import React, { useState, useEffect } from 'react';
import { CashLedgerEntry, DispatchTransaction, Project } from '@/types/database';
import { subscribeCashLedger } from '@/lib/cashLedgerService';
import { subscribeProjects } from '@/lib/projectService';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CashFlowView } from './CashFlowView';
import { ReceivablesView } from './ReceivablesView';

interface CashLedgerPageProps {
  userEmail: string;
  activeSubTab?: string;
  onNavigateSubTab?: (tab: any, subTabId?: string) => void;
}

export function CashLedgerPage({
  userEmail,
  activeSubTab = 'cash_flow',
  onNavigateSubTab
}: CashLedgerPageProps): React.JSX.Element {
  const [currentSubTab, setCurrentSubTab] = useState<'cash_flow' | 'receivables'>(
    activeSubTab === 'receivables' ? 'receivables' : 'cash_flow'
  );
  const [entries, setEntries] = useState<CashLedgerEntry[]>([]);
  const [transactions, setTransactions] = useState<DispatchTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (activeSubTab === 'cash_flow' || activeSubTab === 'receivables') {
      setCurrentSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  useEffect(() => {
    // 1. Subscribe Buku Kas
    const unsubLedger = subscribeCashLedger(list => {
      setEntries(list);
      setIsLoading(false);
    });

    // 2. Subscribe Master Proyek
    const unsubProjects = subscribeProjects(list => {
      setProjects(list);
    });

    // 3. Subscribe Transaksi Ritase (untuk Piutang Tempo)
    const txCol = collection(db, 'transactions');
    const qTx = query(txCol, orderBy('createdAt', 'desc'));
    const unsubTx = onSnapshot(
      qTx,
      snap => {
        const list: DispatchTransaction[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<DispatchTransaction, 'id'>)
        }));
        setTransactions(list);
      },
      err => {
        console.warn('Gagal membaca transaksi piutang:', err);
      }
    );

    return () => {
      unsubLedger();
      unsubProjects();
      unsubTx();
    };
  }, []);

  const handleSelectSubTab = (sub: 'cash_flow' | 'receivables') => {
    setCurrentSubTab(sub);
    if (onNavigateSubTab) {
      onNavigateSubTab('cash_ledger', sub);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subtab Switcher Header */}
      <div className="flex items-center justify-between border-b border-[#eaeaea] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectSubTab('cash_flow')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
              currentSubTab === 'cash_flow'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#666666] border border-[#eaeaea] hover:bg-[#f9f9f9]'
            }`}
          >
            Arus Kas Riil & Kewajiban
          </button>
          <button
            type="button"
            onClick={() => handleSelectSubTab('receivables')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
              currentSubTab === 'receivables'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#666666] border border-[#eaeaea] hover:bg-[#f9f9f9]'
            }`}
          >
            Piutang Tempo & Termin Proyek
          </button>
        </div>

        <div className="hidden sm:block text-[11px] text-[#888888]">
          Database: <span className="font-mono text-[#111111]">pataklogisticdb</span>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#eaeaea] rounded-[10px] p-12 text-center text-xs text-[#888888]">
          Memuat data buku kas dan piutang...
        </div>
      ) : currentSubTab === 'cash_flow' ? (
        <CashFlowView
          entries={entries}
          userEmail={userEmail}
          onRefresh={() => {}}
        />
      ) : (
        <ReceivablesView
          transactions={transactions}
          projects={projects}
          userEmail={userEmail}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
}
