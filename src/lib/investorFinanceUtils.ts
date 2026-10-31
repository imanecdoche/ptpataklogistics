import { Investor, InvestorProjectLink, Project, DispatchTransaction, InvestorPayout } from '@/types/database';

export interface AccruedPeriodResult {
  periodCount: number;
  dueDates: string[]; // List of YYYY-MM-DD that have matured
  nextDueDate: string | null; // Next upcoming YYYY-MM-DD
}

/**
 * Menghitung berapa periode bulan yang sudah jatuh tempo (matured)
 * berdasarkan tanggal mulai investasi dan tanggal siklus bulanan (dueDay).
 * 
 * Contoh:
 * Start: 2026-08-15, DueDay: 25, Target: 2026-11-01
 * Jatuh tempo yang terlewati:
 * 1. 2026-08-25 (periode 1)
 * 2. 2026-09-25 (periode 2)
 * 3. 2026-10-25 (periode 3)
 * Total: 3 periode matured. Next due: 2026-11-25.
 */
export function calculateMaturedMonthlyPeriods(
  startDateStr?: string | null,
  dueDayOfMonth = 25,
  targetDate = new Date()
): AccruedPeriodResult {
  if (!startDateStr) {
    return { periodCount: 0, dueDates: [], nextDueDate: null };
  }

  // Parse tanggal mulai investasi
  const startParts = startDateStr.slice(0, 10).split('-');
  if (startParts.length < 3) {
    return { periodCount: 0, dueDates: [], nextDueDate: null };
  }

  const startYear = parseInt(startParts[0] ?? '2026', 10);
  const startMonth = parseInt(startParts[1] ?? '1', 10); // 1-12
  const startDay = parseInt(startParts[2] ?? '1', 10);

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1; // 1-12
  const targetDay = targetDate.getDate();

  const dueDay = Math.min(Math.max(1, Number(dueDayOfMonth) || 25), 31);
  const dueDates: string[] = [];

  // Mulai iterasi bulan dari tahun & bulan start
  let currentYear = startYear;
  let currentMonth = startMonth;

  // Jika tanggal mulai sebelum dueDay di bulan tersebut, maka siklus pertama jatuh tempo di bulan tersebut.
  // Jika tanggal mulai lewat dari dueDay, siklus pertama jatuh tempo di bulan berikutnya.
  if (startDay > dueDay) {
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  let nextDueDate: string | null = null;

  while (true) {
    // Cari tanggal jatuh tempo yang valid untuk bulan ini (misal Feb max 28/29)
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const effectiveDay = Math.min(dueDay, daysInMonth);

    const isPastOrToday =
      currentYear < targetYear ||
      (currentYear === targetYear && currentMonth < targetMonth) ||
      (currentYear === targetYear && currentMonth === targetMonth && effectiveDay <= targetDay);

    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;

    if (isPastOrToday) {
      dueDates.push(dateStr);
    } else {
      nextDueDate = dateStr;
      break;
    }

    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }

    // Safety limit 120 bulan (10 tahun)
    if (dueDates.length > 120) break;
  }

  return {
    periodCount: dueDates.length,
    dueDates,
    nextDueDate
  };
}

export interface InvestorProjectEarnedBreakdown {
  projectId: string;
  projectName: string;
  scheme: 'PERCENTAGE' | 'FIXED_MONTHLY';
  // Untuk percentage:
  percentage?: number;
  netProfitRitase?: number;
  earnedFromProfit?: number;
  // Untuk fixed monthly:
  fixedAmount?: number;
  dueDay?: number;
  periods?: number;
  earnedFromFixed?: number;
  nextDueDate?: string | null;
  // Total hak dari proyek ini:
  totalEarned: number;
}

export interface InvestorFullFinancialReport {
  totalTrips: number;
  totalVolume: number;
  totalRevenue: number;
  totalBuyCost: number;
  totalOperationalCost: number;
  totalExpense: number;
  netProfitTotal: number;
  breakdown: InvestorProjectEarnedBreakdown[];
  totalProfitShareEarned: number;
  totalPayoutWithdrawn: number;
  remainingProfitShare: number;
}

/**
 * Menghitung seluruh aspek keuangan investor secara komprehensif,
 * mendukung skema campuran (% Persentase Laba & Nominal Tetap Bulanan).
 */
export function calculateInvestorFinancials({
  investor,
  projects,
  transactions,
  payouts,
  targetDate = new Date()
}: {
  investor: Investor;
  projects: Project[];
  transactions: DispatchTransaction[];
  payouts: InvestorPayout[];
  targetDate?: Date;
}): InvestorFullFinancialReport {
  let totalTrips = 0;
  let totalVolume = 0;
  let totalRevenue = 0;
  let totalBuyCost = 0;
  let totalOperationalCost = 0;

  transactions.forEach(tx => {
    totalTrips += 1;
    totalVolume += tx.quantity || 0;
    totalRevenue += tx.totalRevenue || 0;
    totalBuyCost += tx.totalBuyCost || 0;
    totalOperationalCost += tx.operationalCost || 0;
  });

  const totalExpense = totalBuyCost + totalOperationalCost;
  const netProfitTotal = totalRevenue - totalExpense;

  const linkedProjects: InvestorProjectLink[] =
    investor.linkedProjects && investor.linkedProjects.length > 0
      ? investor.linkedProjects
      : projects
          .filter(p => p.investorId === investor.id)
          .map(p => ({
            projectId: p.id,
            projectName: p.name,
            capitalAllocation: p.initialDeposit || 0,
            profitShareScheme: p.profitShareScheme || investor.profitShareScheme,
            profitSharePercentage: p.profitSharePercentage ?? investor.profitSharePercentage,
            fixedMonthlyAmount: p.fixedMonthlyAmount ?? investor.fixedMonthlyAmount,
            fixedPayoutDay: p.fixedPayoutDay ?? investor.fixedPayoutDay,
            investmentStartDate: p.investmentStartDate || investor.investmentStartDate,
            assignedAt: p.createdAt || new Date().toISOString()
          }));
  const breakdown: InvestorProjectEarnedBreakdown[] = [];
  let totalProfitShareEarned = 0;

  if (linkedProjects.length > 0) {
    linkedProjects.forEach(link => {
      const proj = projects.find(p => p.id === link.projectId);
      const projName = link.projectName || proj?.name || 'Proyek Lapangan';

      // Transaksi ritase khusus proyek ini
      const projTxs = transactions.filter(tx => tx.projectId === link.projectId);
      const projRev = projTxs.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);
      const projExp = projTxs.reduce((acc, t) => acc + (t.totalBuyCost || 0) + (t.operationalCost || 0), 0);
      const projNet = Math.max(0, projRev - projExp);

      // Tentukan skema: override proyek > investor default
      const scheme =
        link.profitShareScheme ||
        proj?.profitShareScheme ||
        investor.profitShareScheme ||
        'PERCENTAGE';

      if (scheme === 'FIXED_MONTHLY') {
        const fixedAmount =
          link.fixedMonthlyAmount ??
          proj?.fixedMonthlyAmount ??
          investor.fixedMonthlyAmount ??
          0;
        const dueDay =
          link.fixedPayoutDay ??
          proj?.fixedPayoutDay ??
          investor.fixedPayoutDay ??
          25;
        const startDate =
          link.investmentStartDate ||
          proj?.investmentStartDate ||
          investor.investmentStartDate ||
          investor.createdAt;

        const periodResult = calculateMaturedMonthlyPeriods(startDate, dueDay, targetDate);
        const earned = periodResult.periodCount * fixedAmount;
        totalProfitShareEarned += earned;

        breakdown.push({
          projectId: link.projectId,
          projectName: projName,
          scheme: 'FIXED_MONTHLY',
          fixedAmount,
          dueDay,
          periods: periodResult.periodCount,
          earnedFromFixed: earned,
          nextDueDate: periodResult.nextDueDate,
          totalEarned: earned
        });
      } else {
        // PERCENTAGE
        const pct =
          link.profitSharePercentage ??
          proj?.profitSharePercentage ??
          investor.profitSharePercentage ??
          50;
        const earned = projNet * (pct / 100);
        totalProfitShareEarned += earned;

        breakdown.push({
          projectId: link.projectId,
          projectName: projName,
          scheme: 'PERCENTAGE',
          percentage: pct,
          netProfitRitase: projNet,
          earnedFromProfit: earned,
          totalEarned: earned
        });
      }
    });
  } else {
    // Investor belum ditautkan ke proyek spesifik (skema global investor)
    const scheme = investor.profitShareScheme || 'PERCENTAGE';
    if (scheme === 'FIXED_MONTHLY') {
      const fixedAmount = investor.fixedMonthlyAmount || 0;
      const dueDay = investor.fixedPayoutDay || 25;
      const startDate = investor.investmentStartDate || investor.createdAt;

      const periodResult = calculateMaturedMonthlyPeriods(startDate, dueDay, targetDate);
      const earned = periodResult.periodCount * fixedAmount;
      totalProfitShareEarned += earned;

      breakdown.push({
        projectId: 'GLOBAL',
        projectName: 'Portofolio Umum',
        scheme: 'FIXED_MONTHLY',
        fixedAmount,
        dueDay,
        periods: periodResult.periodCount,
        earnedFromFixed: earned,
        nextDueDate: periodResult.nextDueDate,
        totalEarned: earned
      });
    } else {
      const pct = investor.profitSharePercentage || 50;
      const earned = netProfitTotal > 0 ? netProfitTotal * (pct / 100) : 0;
      totalProfitShareEarned += earned;

      breakdown.push({
        projectId: 'GLOBAL',
        projectName: 'Portofolio Umum',
        scheme: 'PERCENTAGE',
        percentage: pct,
        netProfitRitase: Math.max(0, netProfitTotal),
        earnedFromProfit: earned,
        totalEarned: earned
      });
    }
  }

  const totalPayoutWithdrawn = payouts.reduce((acc, p) => acc + (p.amount || 0), 0);
  const remainingProfitShare = Math.max(0, totalProfitShareEarned - totalPayoutWithdrawn);

  return {
    totalTrips,
    totalVolume,
    totalRevenue,
    totalBuyCost,
    totalOperationalCost,
    totalExpense,
    netProfitTotal,
    breakdown,
    totalProfitShareEarned,
    totalPayoutWithdrawn,
    remainingProfitShare
  };
}
