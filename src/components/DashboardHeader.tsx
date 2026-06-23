/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  PlusCircle, 
  RefreshCw, 
  FileSpreadsheet, 
  AlertTriangle 
} from 'lucide-react';
import { StatusDefinition } from '../types';
import { formatIndonesianNumber, calculateDateTotal } from '../utils';

interface DashboardHeaderProps {
  statuses: StatusDefinition[];
  records: Record<string, Record<string, number>>;
  orderedDates: string[];
  onReset: () => void;
  onAddNewDate: () => void;
}

export default function DashboardHeader({
  statuses,
  records,
  orderedDates,
  onReset,
  onAddNewDate
}: DashboardHeaderProps) {
  // Compute some high level indicators using the newest date
  const latestDate = orderedDates[0];
  const previousDate = orderedDates[1];

  const currentValues = latestDate ? (records[latestDate] || {}) : {};
  const prevValues = previousDate ? (records[previousDate] || {}) : {};

  const totalCurrent = calculateDateTotal(currentValues, statuses);
  const totalPrev = calculateDateTotal(prevValues, statuses);

  // Growth calculated as conversion successes: Done Akuisisi value
  const doneAkuisisiId = 'done-akuisisi';
  const successLatest = currentValues[doneAkuisisiId] || 0;
  const successPrevious = prevValues[doneAkuisisiId] || 0;
  const successDelta = successLatest - successPrevious;

  // Let's check status alignment consistency (total size of the pool)
  const isAligned = orderedDates.every((d) => {
    const dTotal = calculateDateTotal(records[d] || {}, statuses);
    return dTotal === totalCurrent;
  });

  // Calculate "On Pipeline" statuses sum (Penawaran, Kunjungan Awal, Deal dll.)
  const pipelineIds = ['penawaran', 'kunjungan-awal', 'deal-collect', 'belum-kunjungan'];
  const pipelineTotal = pipelineIds.reduce((sum, id) => sum + (currentValues[id] || 0), 0);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
              Prioritas 1
            </span>
            {!isAligned && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Total Pool Unbalanced
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Progres Harian Status Kunjungan Prioritas 1
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data dan analisa delta kemajuan status kunjungan merchant.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddNewDate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 px-4.5 rounded-lg shadow-sm transition-all duration-150 active:scale-95"
            id="btn-add-date"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Tanggal</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2 px-4 rounded-lg transition-all duration-150 active:scale-95"
            id="btn-reset-data"
            title="Sesuai screenshot asli"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset ke Asli</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads Pool */}
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-lg p-4 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Pool Merchant
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {latestDate ? formatIndonesianNumber(totalCurrent) : '0'}
            </span>
            {latestDate && previousDate && (
              <span className="text-xs text-slate-500 mt-1 block">
                Selisih Total Pool:{' '}
                <span className={totalCurrent === totalPrev ? 'text-slate-500 font-medium' : 'text-amber-600 font-bold'}>
                  {totalCurrent === totalPrev ? 'Sama (Stabil)' : `${formatIndonesianNumber(totalCurrent - totalPrev)}`}
                </span>
              </span>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Done Akuisisi Successes */}
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-lg p-4 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Done Akuisisi (Success)
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {latestDate ? formatIndonesianNumber(successLatest) : '0'}
            </span>
            {latestDate && previousDate && (
              <span className="flex items-center gap-1 text-xs mt-1">
                {successDelta >= 0 ? (
                  <span className="text-emerald-600 font-semibold flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{formatIndonesianNumber(successDelta)}
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -{formatIndonesianNumber(Math.abs(successDelta))}
                  </span>
                )}
                <span className="text-slate-400">vs hari sebelumnya</span>
              </span>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: In pipeline */}
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-lg p-4 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              On Progress Pipeline
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {latestDate ? formatIndonesianNumber(pipelineTotal) : '0'}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Sekitar {latestDate ? ((pipelineTotal / totalCurrent) * 100).toFixed(1) : '0'}% dari total database
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Date Coverage Status */}
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-lg p-4 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Periode Data
            </span>
            <span className="text-base font-bold text-slate-900 line-clamp-1">
              {orderedDates.length} Hari Pengamatan
            </span>
            <span className="text-xs text-slate-500 mt-1 block text-ellipsis overflow-hidden">
              Rentang: {orderedDates[orderedDates.length - 1] ? orderedDates[orderedDates.length - 1] : ''} - {orderedDates[0] ? orderedDates[0] : ''}
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
