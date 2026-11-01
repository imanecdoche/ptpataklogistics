import React, { useState, useMemo } from 'react';
import { DispatchTransaction } from '@/types/database';

interface DashboardInlineChartProps {
  transactions: DispatchTransaction[];
  hideMargin?: boolean;
}

type ChartCategory = 'ritase' | 'financial';
type RitaseMetric = 'trips' | 'volumeDt' | 'volumeTon';
type FinancialMetric = 'revenue' | 'profit';

interface MetricConfig {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  formatValue: (d: { trips: number; volumeDt: number; volumeTon: number; revenue: number; profit: number }) => string;
  getValue: (d: { trips: number; volumeDt: number; volumeTon: number; revenue: number; profit: number }) => number;
}

const RITASE_METRICS: MetricConfig[] = [
  {
    id: 'trips',
    label: 'Jumlah Trip Ritase',
    shortLabel: 'Trip',
    color: '#111111',
    formatValue: d => `${d.trips} Trip`,
    getValue: d => d.trips
  },
  {
    id: 'volumeDt',
    label: 'Volume (DT)',
    shortLabel: 'DT',
    color: '#0284c7', // Sky Blue
    formatValue: d => `${d.volumeDt.toLocaleString('id-ID')} DT`,
    getValue: d => d.volumeDt
  },
  {
    id: 'volumeTon',
    label: 'Volume (Ton)',
    shortLabel: 'Ton',
    color: '#ea580c', // Bright Orange
    formatValue: d => `${d.volumeTon.toLocaleString('id-ID')} Ton`,
    getValue: d => d.volumeTon
  }
];

const FINANCIAL_METRICS: MetricConfig[] = [
  {
    id: 'revenue',
    label: 'Omzet Penjualan',
    shortLabel: 'Omzet',
    color: '#059669', // Emerald
    formatValue: d => 'Rp ' + Math.round(d.revenue).toLocaleString('id-ID'),
    getValue: d => d.revenue
  },
  {
    id: 'profit',
    label: 'Estimasi Laba Bersih',
    shortLabel: 'Laba',
    color: '#7c3aed', // Purple
    formatValue: d => 'Rp ' + Math.round(d.profit).toLocaleString('id-ID'),
    getValue: d => d.profit
  }
];

/**
 * Menghasilkan SVG path kurva smooth (Monotone Cubic Spline / Fritsch-Carlson)
 * Mencegah overshoot pada puncak dan lembah sehingga bentuk kurva mengalir alami dan akurat terhadap data.
 */
function getSmoothCurvePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  const first = points[0];
  if (!first) return '';
  if (n === 1) {
    return `M ${first.x - 20} ${first.y} L ${first.x + 20} ${first.y}`;
  }
  const second = points[1];
  if (n === 2 && second) {
    const mx = (first.x + second.x) / 2;
    return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} C ${mx.toFixed(2)} ${first.y.toFixed(2)}, ${mx.toFixed(2)} ${second.y.toFixed(2)}, ${second.x.toFixed(2)} ${second.y.toFixed(2)}`;
  }

  // 1. Secant slopes
  const deltas: number[] = [];
  const dxs: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    if (!pCurrent || !pNext) continue;
    const dx = pNext.x - pCurrent.x;
    const dy = pNext.y - pCurrent.y;
    dxs.push(dx);
    deltas.push(dx === 0 ? 0 : dy / dx);
  }

  if (deltas.length < 2) return '';

  // 2. Tangents
  const m: number[] = new Array(n).fill(0);
  m[0] = deltas[0] ?? 0;
  m[n - 1] = deltas[deltas.length - 1] ?? 0;

  for (let i = 1; i < n - 1; i++) {
    const prevDelta = deltas[i - 1] ?? 0;
    const currDelta = deltas[i] ?? 0;
    if (prevDelta * currDelta <= 0) {
      m[i] = 0;
    } else {
      m[i] = (prevDelta + currDelta) / 2;
    }
  }

  // 3. Fritsch-Carlson adjustments to prevent overshoot
  for (let i = 0; i < n - 1; i++) {
    const delta = deltas[i] ?? 0;
    const mi = m[i] ?? 0;
    const miNext = m[i + 1] ?? 0;
    if (delta === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = mi / delta;
      const beta = miNext / delta;
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * alpha * delta;
        m[i + 1] = tau * beta * delta;
      }
    }
  }

  // 4. Generate cubic bezier path
  let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = dxs[i] ?? 0;
    const mi = m[i] ?? 0;
    const miNext = m[i + 1] ?? 0;

    if (!p0 || !p1) continue;

    const cp1x = p0.x + dx / 3;
    const cp1y = p0.y + (mi * dx) / 3;

    const cp2x = p1.x - dx / 3;
    const cp2y = p1.y - (miNext * dx) / 3;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return path;
}

/**
 * Format ringkas label angka pada sumbu Y
 */
function formatYAxisLabel(val: number, isCurrency: boolean): string {
  if (val === 0) return '0';
  if (isCurrency) {
    if (val >= 1_000_000_000) {
      const v = (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
      return `Rp ${v}M`;
    }
    if (val >= 1_000_000) {
      const v = (val / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `Rp ${v}jt`;
    }
    if (val >= 1_000) {
      const v = (val / 1_000).toFixed(0);
      return `Rp ${v}rb`;
    }
    return `Rp ${Math.round(val)}`;
  }
  // Ritase / Volume
  if (val >= 1_000) {
    return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
}

export function DashboardInlineChart({
  transactions,
  hideMargin = false
}: DashboardInlineChartProps): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<ChartCategory>('ritase');
  const [selectedRitaseMetrics, setSelectedRitaseMetrics] = useState<RitaseMetric[]>(['trips']);
  const [selectedFinancialMetrics, setSelectedFinancialMetrics] = useState<FinancialMetric[]>(['revenue']);

  // Hover state untuk crosshair & floating pill
  const [hoverState, setHoverState] = useState<{
    mouseX: number;
    mouseY: number;
    svgPctX: number;
    svgPctY: number;
    date: string;
    points: {
      metricId: string;
      label: string;
      formatted: string;
      color: string;
      x: number;
      y: number;
    }[];
  } | null>(null);

  // Toggle multi-select metrik (minimal 1 harus tetap aktif)
  const toggleMetric = (id: string) => {
    if (activeCategory === 'ritase') {
      const metricId = id as RitaseMetric;
      if (selectedRitaseMetrics.includes(metricId)) {
        if (selectedRitaseMetrics.length > 1) {
          setSelectedRitaseMetrics(selectedRitaseMetrics.filter(m => m !== metricId));
        }
      } else {
        setSelectedRitaseMetrics([...selectedRitaseMetrics, metricId]);
      }
    } else {
      const metricId = id as FinancialMetric;
      if (selectedFinancialMetrics.includes(metricId)) {
        if (selectedFinancialMetrics.length > 1) {
          setSelectedFinancialMetrics(selectedFinancialMetrics.filter(m => m !== metricId));
        }
      } else {
        setSelectedFinancialMetrics([...selectedFinancialMetrics, metricId]);
      }
    }
  };

  // Konfigurasi metrik aktif saat ini
  const currentMetricConfigs = activeCategory === 'ritase' ? RITASE_METRICS : FINANCIAL_METRICS;
  const selectedMetricIds: string[] = activeCategory === 'ritase' ? selectedRitaseMetrics : selectedFinancialMetrics;
  const activeConfigs = useMemo(() => {
    const list = currentMetricConfigs.filter(m => selectedMetricIds.includes(m.id));
    return list.length > 0 ? list : [currentMetricConfigs[0]!];
  }, [currentMetricConfigs, selectedMetricIds]);

  const isMultiSelect = activeConfigs.length > 1;

  // Agregasi transaksi per tanggal (diurutkan tanggal kronologis)
  const chartData = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        trips: number;
        volumeDt: number;
        volumeTon: number;
        revenue: number;
        profit: number;
      }
    >();

    transactions.forEach(t => {
      const d = t.deliveryDate || t.createdAt?.slice(0, 10) || 'Unknown';
      const existing = map.get(d) || {
        date: d,
        trips: 0,
        volumeDt: 0,
        volumeTon: 0,
        revenue: 0,
        profit: 0
      };

      existing.trips += 1;
      const qty = Number(t.quantity) || 0;
      if (t.unit === 'Ton') {
        existing.volumeTon += qty;
      } else {
        existing.volumeDt += qty;
      }
      existing.revenue += Number(t.totalRevenue) || 0;
      existing.profit += Number(t.netProfit) || 0;

      map.set(d, existing);
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Jika data kosong, sediakan 1 dummy titik hari ini
    if (sorted.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      return [
        {
          date: today,
          trips: 0,
          volumeDt: 0,
          volumeTon: 0,
          revenue: 0,
          profit: 0
        }
      ];
    }

    return sorted;
  }, [transactions]);

  // Format Helper
  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  // Ukuran Canvas SVG yang lebar, tinggi, dan responsif
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = isMultiSelect ? 46 : 56;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 20;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Nilai maksimum untuk masing-masing metrik aktif
  const maxValues = useMemo(() => {
    const map = new Map<string, number>();
    activeConfigs.forEach(cfg => {
      const vals = chartData.map(d => cfg.getValue(d));
      const m = Math.max(...vals, 1);
      map.set(cfg.id, m);
    });
    return map;
  }, [activeConfigs, chartData]);

  // Data kurva garis untuk semua metrik aktif
  const linesData = useMemo(() => {
    const totalPts = chartData.length;

    return activeConfigs.map(cfg => {
      const maxVal = maxValues.get(cfg.id) || 1;

      const coords = chartData.map((d, idx) => {
        const x = totalPts === 1
          ? (paddingLeft + (svgWidth - paddingRight)) / 2
          : paddingLeft + (idx / (totalPts - 1)) * chartW;
        const val = cfg.getValue(d);
        const y = paddingTop + chartH - (val / maxVal) * chartH;
        return {
          metricId: cfg.id,
          label: cfg.shortLabel,
          val,
          formatted: cfg.formatValue(d),
          color: cfg.color,
          date: d.date,
          x,
          y
        };
      });

      const linePath = getSmoothCurvePath(coords);

      const first = coords[0];
      const last = coords[coords.length - 1];
      const baseY = paddingTop + chartH;
      const areaPath =
        coords.length > 0 && first && last
          ? `${linePath} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`
          : '';

      return {
        config: cfg,
        coords,
        linePath,
        areaPath,
        maxVal
      };
    });
  }, [activeConfigs, chartData, maxValues, chartW, chartH, paddingLeft, paddingTop]);

  // Statistik Ringkasan (Menampilkan metrik utama / pertama yang aktif)
  const primaryMetric = activeConfigs[0]!;
  const stats = useMemo(() => {
    if (chartData.length === 0) return { peak: '0', avg: '0', total: '0' };
    const values = chartData.map(d => primaryMetric.getValue(d));
    const maxVal = Math.max(...values, 0);
    const sumVal = values.reduce((a, b) => a + b, 0);
    const avgVal = sumVal / (values.length || 1);

    const isCurrency = activeCategory === 'financial';

    return {
      peak: isCurrency ? formatRupiah(maxVal) : `${maxVal.toLocaleString('id-ID')}`,
      avg: isCurrency ? formatRupiah(avgVal) : `${Math.round(avgVal).toLocaleString('id-ID')}`,
      total: isCurrency ? formatRupiah(sumVal) : `${sumVal.toLocaleString('id-ID')}`
    };
  }, [chartData, primaryMetric, activeCategory]);

  // Handler interaksi mouse hover & tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const fracX = Math.max(0, Math.min(1, clientX / rect.width));
    const fracY = Math.max(0, Math.min(1, clientY / rect.height));

    const mouseX = fracX * svgWidth;
    const mouseY = fracY * svgHeight;

    // Cari indeks tanggal data terdekat di sumbu X
    const totalPts = chartData.length;
    let activeIndex = 0;
    if (totalPts > 1) {
      const rawIndex = ((mouseX - paddingLeft) / chartW) * (totalPts - 1);
      activeIndex = Math.max(0, Math.min(totalPts - 1, Math.round(rawIndex)));
    }

    const d = chartData[activeIndex];
    if (!d) return;

    // Ambil data dari semua garis aktif pada tanggal ini
    const pts = linesData
      .map(line => line.coords[activeIndex])
      .filter((pt): pt is NonNullable<typeof pt> => Boolean(pt));

    setHoverState({
      mouseX,
      mouseY,
      svgPctX: fracX * 100,
      svgPctY: fracY * 100,
      date: d.date,
      points: pts
    });
  };

  const handleMouseLeave = () => {
    setHoverState(null);
  };

  return (
    <div className="bg-white rounded-[10px] p-4 sm:p-5 border border-[#eaeaea] shadow-xs space-y-4 animate-in fade-in duration-200">
      {/* Header Inline Chart */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#f0f0f0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#f0f0f0] flex items-center justify-center shrink-0">
            <img src="/icons/chart-line.png" alt="" className="w-4 h-4 object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] tracking-tight">Grafik Tren Operasional</h2>
            <p className="text-[11px] text-[#777777]">Visualisasi fluktuasi ritase armada & performa finansial</p>
          </div>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('ritase')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold border-none transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'ritase'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
            }`}
          >
            Tren Ritase & Volume
          </button>
          {!hideMargin && (
            <button
              type="button"
              onClick={() => setActiveCategory('financial')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold border-none transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'financial'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
              }`}
            >
              Tren Finansial
            </button>
          )}
        </div>
      </div>

      {/* Baris Tombol Multi-Select (Kiri) & Legenda Kotak Warna (Kanan Align Right) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-1">
        {/* Tombol Multi-Select Metrik */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          {currentMetricConfigs.map(m => {
            const isSelected = selectedMetricIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMetric(m.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border-none transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'bg-[#f0f0f0] text-[#666666] hover:bg-[#e4e4e4]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-[2px] shrink-0"
                  style={{ backgroundColor: isSelected && m.color === '#111111' ? '#ffffff' : m.color }}
                />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Legenda Warna Kotak Rata Kanan (Align Right) */}
        <div className="flex items-center gap-3 justify-end text-xs select-none sm:self-center shrink-0">
          {activeConfigs.map(m => (
            <div key={m.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-[2px] shrink-0 shadow-xs border border-zinc-300"
                style={{ backgroundColor: m.color }}
              />
              <span className="text-[11px] font-medium text-[#444444] whitespace-nowrap">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Viewport & Tooltip Area */}
      <div className="relative w-full bg-[#fafafa] rounded-[10px] border border-[#eaeaea] p-3 sm:p-4 flex flex-col items-center select-none">
        {/* SVG Container dengan Relative Wrapper untuk Floating Tooltip tepat di atas kursor */}
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-64 sm:h-72 md:h-80 select-none overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="singleChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeConfigs[0]?.color || '#111111'} stopOpacity="0.14" />
                <stop offset="100%" stopColor={activeConfigs[0]?.color || '#111111'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Sumbu Y & Gridlines Horizontal */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + chartH * (1 - ratio);
              return (
                <g key={i}>
                  {/* Label Nilai Sumbu Y Rata Kanan di Samping Kiri Grid */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#888888"
                    fontSize="10"
                    className="font-mono font-medium select-none"
                  >
                    {isMultiSelect
                      ? `${Math.round(ratio * 100)}%`
                      : formatYAxisLabel((linesData[0]?.maxVal || 1) * ratio, activeCategory === 'financial')}
                  </text>
                  {/* Gridline Horizontal */}
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#eaeaea"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Area Under Curve (Hanya saat 1 metrik aktif agar tidak tumpang tindih) */}
            {!isMultiSelect && linesData[0]?.areaPath && (
              <path d={linesData[0].areaPath} fill="url(#singleChartGradient)" />
            )}

            {/* Garis Kurva Smooth untuk semua metrik aktif */}
            {linesData.map(line => (
              <path
                key={line.config.id}
                d={line.linePath}
                fill="none"
                stroke={line.config.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Crosshair Horizontal (Mengikuti kursor Y secara dinamis) */}
            {hoverState && (
              <line
                x1={paddingLeft}
                y1={hoverState.mouseY}
                x2={svgWidth - paddingRight}
                y2={hoverState.mouseY}
                stroke="#666666"
                strokeOpacity="0.35"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )}

            {/* Crosshair Vertikal (Mengunci ke tanggal aktif terdekat di X) */}
            {hoverState && hoverState.points[0] && (
              <line
                x1={hoverState.points[0].x}
                y1={paddingTop}
                x2={hoverState.points[0].x}
                y2={paddingTop + chartH}
                stroke="#666666"
                strokeOpacity="0.35"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )}

            {/* Titik-titik Kurva (Selalu tampak halus) */}
            {linesData.map(line =>
              line.coords.map((pt, idx) => (
                <circle
                  key={`${line.config.id}-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverState?.points.some(p => p.metricId === line.config.id && p.x === pt.x) ? 5.5 : 3}
                  fill={pt.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-100"
                />
              ))
            )}
          </svg>

          {/* Floating Dark Pill Tooltip tepat di atas posisi kursor mouse */}
          {hoverState && (
            <div
              className="pointer-events-none absolute z-30 transition-all duration-75 ease-out select-none"
              style={{
                left: `${hoverState.svgPctX}%`,
                top: `${hoverState.svgPctY}%`,
                transform: (() => {
                  if (hoverState.svgPctX < 18) return 'translate(-8%, -100%) translateY(-14px)';
                  if (hoverState.svgPctX > 82) return 'translate(-92%, -100%) translateY(-14px)';
                  return 'translate(-50%, -100%) translateY(-14px)';
                })()
              }}
            >
              <div className="relative px-3 py-1.5 bg-[#111111] text-white rounded-[7px] shadow-xl text-[11px] whitespace-nowrap flex items-center gap-2 border-none">
                {/* Tanggal Ringkas */}
                <span className="text-zinc-400 font-mono text-[10px] font-medium">
                  {hoverState.date.length === 10 ? hoverState.date.slice(5) : hoverState.date}
                </span>

                {/* Divider Tipis */}
                <span className="text-zinc-600">|</span>

                {/* Nilai seluruh data aktif dipisahkan divider tipis */}
                {hoverState.points.map((pt, idx) => (
                  <React.Fragment key={pt.metricId}>
                    {idx > 0 && <span className="text-zinc-600">|</span>}
                    <span className="flex items-center gap-1.5 font-bold tracking-tight">
                      {isMultiSelect && (
                        <span
                          className="w-2 h-2 rounded-[2px] shrink-0 inline-block border border-white/30"
                          style={{ backgroundColor: pt.color === '#111111' ? '#ffffff' : pt.color }}
                        />
                      )}
                      <span
                        style={{
                          color: pt.color === '#111111' ? '#ffffff' : pt.color
                        }}
                      >
                        {pt.formatted}
                      </span>
                    </span>
                  </React.Fragment>
                ))}

                {/* Panah penunjuk halus menghadap ke bawah kursor */}
                <div
                  className="absolute -bottom-1 w-2 h-2 bg-[#111111] rotate-45"
                  style={{
                    left: (() => {
                      if (hoverState.svgPctX < 18) return '15%';
                      if (hoverState.svgPctX > 82) return '85%';
                      return '50%';
                    })(),
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Date Labels presisi di bawah chart */}
        <div
          className="w-full flex justify-between pt-2 text-[10px] text-[#888888]"
          style={{
            paddingLeft: `${(paddingLeft / svgWidth) * 100}%`,
            paddingRight: `${(paddingRight / svgWidth) * 100}%`
          }}
        >
          <span>{chartData[0]?.date || ''}</span>
          {chartData.length > 2 && (
            <span>{chartData[Math.floor(chartData.length / 2)]?.date || ''}</span>
          )}
          <span>{chartData[chartData.length - 1]?.date || ''}</span>
        </div>
      </div>

      {/* Quick Statistics Summary Cards (Menampilkan metrik yang aktif) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-white rounded-[8px] border border-[#eaeaea] text-center">
          <span className="text-[10px] text-[#777777] font-medium block">
            Puncak ({primaryMetric.shortLabel})
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#111111] truncate block mt-0.5">
            {stats.peak}
          </span>
        </div>
        <div className="p-3 bg-white rounded-[8px] border border-[#eaeaea] text-center">
          <span className="text-[10px] text-[#777777] font-medium block">
            Rata-rata ({primaryMetric.shortLabel})
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#111111] truncate block mt-0.5">
            {stats.avg}
          </span>
        </div>
        <div className="p-3 bg-white rounded-[8px] border border-[#eaeaea] text-center">
          <span className="text-[10px] text-[#777777] font-medium block">
            Total ({primaryMetric.shortLabel})
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#111111] truncate block mt-0.5">
            {stats.total}
          </span>
        </div>
      </div>
    </div>
  );
}
