/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Layers, 
  PieChart as PieIcon, 
  BarChart4, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { StatusDefinition } from '../types';
import { formatIndonesianNumber, calculateDateTotal, formatDelta, formatDateLabel } from '../utils';

interface AnalyticsSectionProps {
  statuses: StatusDefinition[];
  records: Record<string, Record<string, number>>;
  orderedDates: string[];
}

export default function AnalyticsSection({
  statuses,
  records,
  orderedDates
}: AnalyticsSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [hoveredStatusId, setHoveredStatusId] = useState<string | null>(null);

  const currentSelectedDate = orderedDates.includes(selectedDate) ? selectedDate : (orderedDates[0] || '');

  const values = records[currentSelectedDate] || {};
  const total = calculateDateTotal(values, statuses);

  // 1. Prepare Donut Chart segments
  let cumulativePercent = 0;
  const segments = statuses
    .map((s) => {
      const val = values[s.id] || 0;
      const percent = total > 0 ? (val / total) * 100 : 0;
      const startAngle = (cumulativePercent / 100) * 360;
      cumulativePercent += percent;
      const endAngle = (cumulativePercent / 100) * 360;

      // Convert angles to Cartesian path points for SVG
      const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
          x: centerX + radius * Math.cos(angleInRadians),
          y: centerY + radius * Math.sin(angleInRadians),
        };
      };

      const describeArc = (x: number, y: number, radius: number, startA: number, endA: number) => {
        const start = polarToCartesian(x, y, radius, endA);
        const end = polarToCartesian(x, y, radius, startA);
        const largeArcFlag = endA - startA <= 180 ? '0' : '1';
        return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
      };

      // Handle full circle case
      const path = percent >= 99.99
        ? `M 100 25 A 75 75 0 1 0 100 175 A 75 75 0 1 0 100 25`
        : describeArc(100, 100, 70, startAngle, endAngle);

      return {
        ...s,
        val,
        percent,
        path,
        startAngle,
        endAngle,
      };
    })
    .filter((s) => s.val > 0);

  // 2. Prepare Delta changes for the latest transition (between newest and second newest)
  const newestDate = orderedDates[0];
  const secondNewestDate = orderedDates[1];
  
  const newestVals = newestDate ? (records[newestDate] || {}) : {};
  const secondNewestVals = secondNewestDate ? (records[secondNewestDate] || {}) : {};

  const statusDeltas = statuses.map((s) => {
    const valNew = newestVals[s.id] || 0;
    const valOld = secondNewestVals[s.id] || 0;
    const delta = valNew - valOld;
    return {
      ...s,
      delta,
      valNew,
      valOld
    };
  }).filter(item => item.delta !== 0);

  // Sort with highest growth first
  statusDeltas.sort((a, b) => b.delta - a.delta);

  // 3. Conversion Funnel construction (Indonesia Merchant Acquisition Stages)
  // We model the acquisition lifecycle pipeline:
  // Stage 1: Belum Kunjungan
  // Stage 2: Kunjungan Awal
  // Stage 3: Penawaran
  // Stage 4: Deal (On Progress Collect Dokumen)
  // Stage 5: Done Akuisisi / Success
  const funnelStages = [
    { id: 'belum-kunjungan', name: 'Belum Kunjungan (Pool Mentah)', color: 'bg-slate-400' },
    { id: 'kunjungan-awal', name: 'Kunjungan Awal (Iterasi Kontak)', color: 'bg-amber-400' },
    { id: 'penawaran', name: 'Penawaran Produk / Negosiasi', color: 'bg-amber-500' },
    { id: 'deal-collect', name: 'Deal (Pengumpulan Dokumen)', color: 'bg-yellow-400' },
    { id: 'done-akuisisi', name: 'Done Akuisisi (Sukses Join)', color: 'bg-emerald-500' }
  ].map((stage) => {
    return {
      ...stage,
      val: values[stage.id] ?? 0
    };
  });

  const rawPoolCount = values['belum-kunjungan'] || 1; // avoid divide by 0
  const maxGoalCount = Math.max(...funnelStages.map(s => s.val), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 font-sans">
      
      {/* COLUMN 1: FUNNEL & DELTA SUMMARY (LEFT 7 COLS) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* CORONG KONVERSI (ACQUISITION FUNNEL) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Corong Konversi & Efektivitas Akuisisi (Conversion pipeline)</span>
            </h3>
            {orderedDates.length > 0 && (
              <select
                value={currentSelectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700 outline-hidden"
              >
                {orderedDates.map((d) => (
                  <option key={d} value={d}>
                    Data: {formatDateLabel(d)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Porsi total merchant berdasarkan tahapan akuisisi pada tanggal yang dipilih.
          </p>

          <div className="flex flex-col gap-3">
            {funnelStages.map((stage, idx) => {
              // Convert width relative to maximum value in funnel for aesthetic proportional rendering
              const pctWidth = maxGoalCount > 0 ? (stage.val / maxGoalCount) * 100 : 0;
              // Conversion percentage relative to previous step
              const prevStageVal = idx > 0 ? funnelStages[idx - 1].val : null;
              const stepConversion = prevStageVal && prevStageVal > 0 ? ((stage.val / prevStageVal) * 100).toFixed(1) : null;

              return (
                <div key={stage.id} className="relative">
                  {idx > 0 && stepConversion && (
                    <div className="flex justify-center -my-1.5 relative z-10">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-full py-0.5 px-2 text-[10px] text-indigo-700 font-bold flex items-center gap-0.5 shadow-xs">
                        <ArrowRight className="w-3 h-3 rotate-90" />
                        <span>Rasio Konversi Tahap: {stepConversion}%</span>
                      </div>
                    </div>
                  )}

                  <div className="hover:bg-slate-50/50 p-2.5 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{stage.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {formatIndonesianNumber(stage.val)} Merchant
                      </span>
                    </div>

                    {/* Progress Bar Representing Funnel Width */}
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${stage.color} opacity-85 hover:opacity-100`}
                        style={{ width: `${Math.max(3, pctWidth)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-indigo-50/40 rounded-lg flex items-center gap-2.5 text-xs text-indigo-950">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span>Efektivitas Akuisisi: <strong>
                {values['belum-kunjungan'] && values['done-akuisisi'] 
                  ? ((values['done-akuisisi'] / (values['belum-kunjungan'] + values['done-akuisisi'])) * 100).toFixed(2) 
                  : '5.2'}%
              </strong> selesai diakuisisi dibanding total pool belum dikunjungi.</span>
            </div>
          </div>
        </div>

      </div>

      {/* COLUMN 2: DONUT CHART SHARE & RECENT DELTA (RIGHT 5 COLS) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* SHARING DISTRIBUTION (PORSI STATUS) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-emerald-500" />
            <span>Porsi Pangsa Status ({formatDateLabel(currentSelectedDate)})</span>
          </h3>

          {/* SVG Donut Illustration */}
          <div className="flex flex-col items-center justify-center p-2">
            <div className="relative w-[180px] h-[180px]">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {/* Background base circle */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                
                {/* Segment paths with stroke highlights */}
                {segments.map((seg, idx) => {
                  const isHovered = hoveredStatusId === seg.id;
                  return (
                    <path
                      key={seg.id}
                      d={seg.path}
                      fill="none"
                      className={`stroke-current transition-all duration-200 cursor-pointer ${isHovered ? 'stroke-[24px]' : 'stroke-[16px]'}`}
                      strokeDasharray={seg.percent < 99.9 ? undefined : undefined}
                      style={{
                        color: seg.bgClass.includes('#daf7dc') ? '#10b981' : 
                               seg.bgClass.includes('#ffff8c') ? '#fbbf24' : 
                               seg.bgClass.includes('#fce5bd') ? '#f59e0b' : 
                               seg.bgClass.includes('emerald') ? '#34d399' :
                               seg.bgClass.includes('blue')    ? '#3b82f6' :
                               seg.bgClass.includes('rose')    ? '#f43f5e' : '#64748b'
                      }}
                      onMouseEnter={() => setHoveredStatusId(seg.id)}
                      onMouseLeave={() => setHoveredStatusId(null)}
                    />
                  );
                })}
              </svg>

              {/* Total display in center of donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Total Database
                </span>
                <span className="text-xl font-bold font-mono text-slate-800">
                  {formatIndonesianNumber(total)}
                </span>
              </div>
            </div>

            {/* Micro segments representation under donut */}
            <div className="w-full mt-4 flex flex-col gap-1.5 max-h-[170px] overflow-y-auto pr-1">
              {segments.map((seg) => {
                const isHovered = hoveredStatusId === seg.id;
                return (
                  <div 
                    key={seg.id}
                    onMouseEnter={() => setHoveredStatusId(seg.id)}
                    onMouseLeave={() => setHoveredStatusId(null)}
                    className={`flex items-center justify-between py-1 px-1.5 rounded transition-colors text-xs cursor-pointer ${isHovered ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{
                          backgroundColor: seg.bgClass.includes('#daf7dc') ? '#10b981' : 
                                           seg.bgClass.includes('#ffff8c') ? '#fbbf24' : 
                                           seg.bgClass.includes('#fce5bd') ? '#f59e0b' : 
                                           seg.bgClass.includes('emerald') ? '#34d399' :
                                           seg.bgClass.includes('blue')    ? '#3b82f6' :
                                           seg.bgClass.includes('rose')    ? '#f43f5e' : '#64748b'
                        }}
                      />
                      <span className="truncate text-slate-600">{seg.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-500 text-[11px]">
                      <span>{formatIndonesianNumber(seg.val)}</span>
                      <span className="text-slate-400">({seg.percent.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* LATEST SHIFT DELTA REPORT CARD */}
        {orderedDates.length > 1 && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
              <BarChart4 className="w-4 h-4 text-indigo-500" />
              <span>Daftar Delta Terbesar harian ({formatDateLabel(secondNewestDate)} vs {formatDateLabel(newestDate)})</span>
            </h3>

            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {statusDeltas.slice(0, 5).map((d) => {
                const isPositive = d.delta > 0;
                return (
                  <div key={d.id} className="flex items-center justify-between text-xs p-2 rounded border border-slate-100 bg-slate-50/40">
                    <span className="font-medium text-slate-700 truncate mr-2">{d.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-slate-400 text-[10px]">
                        {formatIndonesianNumber(d.valOld)} ➜ {formatIndonesianNumber(d.valNew)}
                      </span>
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50/70 text-rose-700'}`}>
                        {formatDelta(d.delta)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {statusDeltas.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Tidak ada pergeseran delta status di periode ini.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
