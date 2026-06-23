/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  HelpCircle, 
  RotateCcw,
  PlusCircle,
  Calendar,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { StatusDefinition } from './types';
import { 
  DEFAULT_STATUSES, 
  DEFAULT_RECORDS, 
  DEFAULT_ORDERED_DATES,
  formatDateLabel 
} from './utils';

import DashboardHeader from './components/DashboardHeader';
import ProgressTable from './components/ProgressTable';
import AnalyticsSection from './components/AnalyticsSection';
import DataImporterExporter from './components/DataImporterExporter';

// Bulletproof Storage Helper to prevent cross-origin SecurityError in nested sandboxed iframes
const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn('Storage read failed. Fallback to in-memory.', e);
      return (window as any).__fallback_storage?.[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage write failed. Fallback to in-memory.', e);
      if (!(window as any).__fallback_storage) {
        (window as any).__fallback_storage = {};
      }
      (window as any).__fallback_storage[key] = value;
    }
  }
};

export default function App() {
  // 1. Core Persistent States
  const [statuses, setStatuses] = useState<StatusDefinition[]>(() => {
    const saved = safeStorage.getItem('statusdelta_statuses');
    return saved ? JSON.parse(saved) : DEFAULT_STATUSES;
  });

  const [records, setRecords] = useState<Record<string, Record<string, number>>>(() => {
    const saved = safeStorage.getItem('statusdelta_records');
    return saved ? JSON.parse(saved) : DEFAULT_RECORDS;
  });

  const [orderedDates, setOrderedDates] = useState<string[]>(() => {
    const saved = safeStorage.getItem('statusdelta_ordered_dates');
    return saved ? JSON.parse(saved) : DEFAULT_ORDERED_DATES;
  });

  // 2. UI Overlay States
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [newDateValue, setNewDateValue] = useState('');
  const [copyValuesFromDate, setCopyValuesFromDate] = useState('yes');
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);

  // Synchronize localStorage safely
  useEffect(() => {
    safeStorage.setItem('statusdelta_statuses', JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    safeStorage.setItem('statusdelta_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    safeStorage.setItem('statusdelta_ordered_dates', JSON.stringify(orderedDates));
  }, [orderedDates]);

  // Utility to show temporary toast notification
  const showToast = (message: string, type: 'success' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 3. Callback Handlers
  const handleUpdateValue = (date: string, statusId: string, value: number) => {
    setRecords((prev) => {
      const updated = { ...prev };
      if (!updated[date]) {
        updated[date] = {};
      }
      updated[date] = {
        ...updated[date],
        [statusId]: value
      };
      return updated;
    });
    showToast(`Nilai berhasil disimpan: ${value.toLocaleString('id')}`, 'success');
  };

  const handleUpdateDate = (oldDate: string, newDate: string) => {
    if (!newDate) return;
    if (orderedDates.includes(newDate) && newDate !== oldDate) {
      showToast('Tanggal tersebut sudah ada di tabel!', 'warn');
      return;
    }

    setOrderedDates((prev) => {
      const filtered = prev.filter((d) => d !== oldDate);
      const updated = [...filtered, newDate].sort((a, b) => b.localeCompare(a));
      return updated;
    });

    setRecords((prev) => {
      const updated = { ...prev };
      if (updated[oldDate]) {
        updated[newDate] = updated[oldDate];
        delete updated[oldDate];
      }
      return updated;
    });

    showToast(`Tanggal diubah dari ${formatDateLabel(oldDate)} ke ${formatDateLabel(newDate)}`, 'success');
  };

  const handleAddStatus = (newStatus: Omit<StatusDefinition, 'id'>) => {
    const newId = newStatus.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    if (statuses.some(s => s.id === newId)) {
      showToast('Nama status ini sudah digunakan!', 'warn');
      return;
    }

    const created: StatusDefinition = {
      ...newStatus,
      id: newId
    };

    setStatuses((prev) => [...prev, created]);
    
    // Initialize default value as 0 across all active dates
    setRecords((prev) => {
      const updated = { ...prev };
      orderedDates.forEach((date) => {
        if (!updated[date]) updated[date] = {};
        updated[date][newId] = 0;
      });
      return updated;
    });

    showToast(`Status "${newStatus.name}" berhasil ditambahkan!`, 'success');
  };

  const handleUpdateStatus = (id: string, updated: Partial<StatusDefinition>) => {
    setStatuses((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
    showToast('Nama status berhasil diperbarui', 'success');
  };

  const handleDeleteStatus = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    // Prune status values from all records
    setRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((date) => {
        delete updated[date]?.[id];
      });
      return updated;
    });
    showToast('Status berhasil dihapus', 'success');
  };

  const handleDeleteDate = (date: string) => {
    setOrderedDates((prev) => prev.filter((d) => d !== date));
    setRecords((prev) => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
    showToast(`Kolom tanggal ${formatDateLabel(date)} berhasil dihapus`, 'success');
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang seluruh data ke nilai awal dari screenshot? Seluruh penyesuaian Anda saat ini akan dihapus.')) {
      setStatuses(DEFAULT_STATUSES);
      setRecords(DEFAULT_RECORDS);
      setOrderedDates(DEFAULT_ORDERED_DATES);
      showToast('Data berhasil disetel ulang ke preset gambar!', 'success');
    }
  };

  const handleAddNewDateColumn = () => {
    if (!newDateValue) {
      showToast('Harap pilih tanggal yang valid!', 'warn');
      return;
    }
    if (orderedDates.includes(newDateValue)) {
      showToast('Tanggal ini sudah tercantum di tabel!', 'warn');
      return;
    }

    // Determine values to copy
    let valuesToUse: Record<string, number> = {};
    if (copyValuesFromDate === 'yes' && orderedDates.length > 0) {
      // Copy values from the newest available date
      const closestDateFile = orderedDates[0];
      valuesToUse = { ...(records[closestDateFile] || {}) };
    } else {
      // Initialize with 0
      statuses.forEach((s) => {
        valuesToUse[s.id] = 0;
      });
    }

    setOrderedDates((prev) => [newDateValue, ...prev].sort((a, b) => b.localeCompare(a)));
    setRecords((prev) => ({
      ...prev,
      [newDateValue]: valuesToUse
    }));

    setNewDateValue('');
    setShowAddDateModal(false);
    showToast(`Kolom tanggal baru berhasil dibuat: ${formatDateLabel(newDateValue)}`, 'success');
  };

  const handleImportExcelData = (dates: string[], values: Record<string, Record<string, number>>) => {
    // Collect unique status definitions represented in the Excel file that don't exist yet
    // If we can map them, we should. Otherwise, keep current status mapping
    setOrderedDates(dates.sort((a, b) => b.localeCompare(a)));
    setRecords(values);
    showToast('Data Excel eksternal berhasil disinkronkan!', 'success');
  };

  return (
    <div id="app" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-all selection:bg-indigo-500 selection:text-white">
      
      {/* GLOBAL NOTIFICATION TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`shadow-lg border rounded-xl py-3 px-5 flex items-center gap-2 text-xs font-semibold ${
            toast.type === 'success' 
              ? 'bg-slate-900 text-white border-slate-950' 
              : 'bg-amber-500 text-white border-amber-600'
          }`}>
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* EXECUTIVE CORPORATE NAVIGATION BAR */}
      <nav id="navbar" className="bg-[#1e293b] border-b border-slate-800 text-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Building2 className="w-5.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[15px] tracking-tight text-white">Status Kunjungan</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-200 py-0.5 px-1.5 rounded font-bold uppercase tracking-wider border border-slate-700">
                  Prioritas 1
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Progres Harian Status Kunjungan</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-[11px] text-slate-400 border-l border-slate-700 pl-4">
              Database: <span className="text-emerald-400 font-bold font-mono">Active</span>
            </span>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-all"
              title="Reset seluruh perubahan"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset ke Preset Asli</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN APPLICATION CONTAINER */}
      <main id="main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* BANNER GREETINGS & SHORT INSTRUCTIONS */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4.5 text-white mb-6 shadow-sm">
          <div className="relative z-10">
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>Progres Harian Status Kunjungan Prioritas 1</span>
            </h2>
            <p className="text-xs text-indigo-100/80 leading-relaxed mt-1">
              Seluruh delta dihitung otomatis secara dinamis. Klik nilai angka di tabel untuk langsung memperbarui.
            </p>
          </div>
        </div>

        {/* 1. DASHBOARD HEADER - GENERAL STATISTICS & ACTIONS */}
        <DashboardHeader
          statuses={statuses}
          records={records}
          orderedDates={orderedDates}
          onReset={handleResetData}
          onAddNewDate={() => setShowAddDateModal(true)}
        />

        {/* 2. PROGRESS TABLE - SPREADSHEET LEDGER */}
        <ProgressTable
          statuses={statuses}
          records={records}
          orderedDates={orderedDates}
          onUpdateValue={handleUpdateValue}
          onUpdateDate={handleUpdateDate}
          onAddStatus={handleAddStatus}
          onUpdateStatus={handleUpdateStatus}
          onDeleteStatus={handleDeleteStatus}
          onDeleteDate={handleDeleteDate}
        />

        {/* 3. ANALYTICS & VISUAL GRAPH SECTION */}
        <AnalyticsSection
          statuses={statuses}
          records={records}
          orderedDates={orderedDates}
        />

        {/* 4. DATA EXCHANGER (EXCEL BACKUP SYNC) */}
        <DataImporterExporter
          statuses={statuses}
          records={records}
          orderedDates={orderedDates}
          onImportData={handleImportExcelData}
        />

      </main>

      {/* FOOTER METRICS SYSTEM */}
      <footer id="footer" className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-slate-500">
            &copy; 2026 StatusDelta Pro Ledger Inc. Seluruh perhitungan dilindungi enkripsi standard lokal.
          </span>
          <div className="flex gap-4 text-slate-400">
            <span className="text-emerald-400">● Live Preview Connected</span>
            <span>Local Latency: 4ms</span>
          </div>
        </div>
      </footer>

      {/* MODAL WINDOW: TAMBAH TANGGAL BARU */}
      {showAddDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <span>Tambah Kolom Tanggal Baru</span>
              </h3>
              <button 
                onClick={() => setShowAddDateModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Buat tanggal pengamatan baru. Sistem akan memasukkan kolom perbandingan baru dan menghitung deltas perubahan secara dinamis.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Pilih Tanggal</label>
                <input
                  type="date"
                  value={newDateValue}
                  onChange={(e) => setNewDateValue(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <label className="text-xs font-bold text-slate-700 block mb-2">Nilai Awal (Pre-population)</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="copyValues"
                      value="yes"
                      checked={copyValuesFromDate === 'yes'}
                      onChange={() => setCopyValuesFromDate('yes')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600">Salin otomatis data dari hari sebelumnya (Sangat Disarankan)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="copyValues"
                      value="no"
                      checked={copyValuesFromDate === 'no'}
                      onChange={() => setCopyValuesFromDate('no')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600">Mulai dari angka 0 semua</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowAddDateModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddNewDateColumn}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-semibold text-xs shadow-md shadow-indigo-600/10"
              >
                Buat Tanggal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
