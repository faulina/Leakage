/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Trash2, 
  Edit2, 
  Plus, 
  Check, 
  X, 
  Settings, 
  Info,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { StatusDefinition, DateRecord } from '../types';
import { 
  formatIndonesianNumber, 
  formatDelta, 
  formatDateLabel, 
  calculateDateTotal 
} from '../utils';

interface ProgressTableProps {
  statuses: StatusDefinition[];
  records: Record<string, Record<string, number>>;
  orderedDates: string[];
  onUpdateValue: (date: string, statusId: string, value: number) => void;
  onUpdateDate: (oldDate: string, newDate: string) => void;
  onAddStatus: (status: Omit<StatusDefinition, 'id'>) => void;
  onUpdateStatus: (id: string, updated: Partial<StatusDefinition>) => void;
  onDeleteStatus: (id: string) => void;
  onDeleteDate: (date: string) => void;
}

export default function ProgressTable({
  statuses,
  records,
  orderedDates,
  onUpdateValue,
  onUpdateDate,
  onAddStatus,
  onUpdateStatus,
  onDeleteStatus,
  onDeleteDate
}: ProgressTableProps) {
  const [editingCell, setEditingCell] = useState<{ date: string; statusId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDateInput, setNewDateInput] = useState<string>('');

  const [showStatusConfig, setShowStatusConfig] = useState<boolean>(false);
  const [showAddStatusForm, setShowAddStatusForm] = useState<boolean>(false);
  
  // States to add status
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusCategory, setNewStatusCategory] = useState<'active' | 'pipeline' | 'closed-lost' | 'closed-won' | 'other'>('pipeline');
  const [newStatusColor, setNewStatusColor] = useState('border-slate-300');
  const [newStatusBg, setNewStatusBg] = useState('bg-slate-50');

  // Colors mapping for user friendly UI picking
  const COLOR_PRESETS = [
    { label: 'Green', bg: 'bg-[#daf7dc]/80', text: 'text-emerald-950', border: 'border-emerald-200' },
    { label: 'Yellow', bg: 'bg-[#ffff8c]/80', text: 'text-yellow-950', border: 'border-yellow-200' },
    { label: 'Orange', bg: 'bg-[#fce5bd]/80', text: 'text-amber-950', border: 'border-amber-200' },
    { label: 'Slate Gray', bg: 'bg-slate-100/70', text: 'text-slate-800', border: 'border-slate-200' },
    { label: 'Blue', bg: 'bg-blue-50/80', text: 'text-blue-950', border: 'border-blue-200' },
    { label: 'Rose Red', bg: 'bg-rose-50/85', text: 'text-rose-950', border: 'border-rose-200' }
  ];

  const handleCellClick = (date: string, statusId: string, currentVal: number) => {
    setEditingCell({ date, statusId });
    setEditValue(currentVal.toString());
  };

  const handleCellSave = () => {
    if (editingCell) {
      const parsedVal = Math.max(0, parseInt(editValue.replace(/[^0-9]/g, '')) || 0);
      onUpdateValue(editingCell.date, editingCell.statusId, parsedVal);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleDateClick = (date: string) => {
    setEditingDate(date);
    setNewDateInput(date);
  };

  const handleDateSave = () => {
    if (editingDate && newDateInput && newDateInput !== editingDate) {
      onUpdateDate(editingDate, newDateInput);
    }
    setEditingDate(null);
  };

  const handleAddStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;

    // Retrieve corresponding text styling based on color theme background selected
    const selectedPreset = COLOR_PRESETS.find(p => p.bg.includes(newStatusBg.split('/')[0])) || COLOR_PRESETS[0];

    onAddStatus({
      name: newStatusName.trim(),
      category: newStatusCategory,
      color: selectedPreset.border,
      textClass: selectedPreset.text,
      bgClass: newStatusBg
    });

    // Reset status form
    setNewStatusName('');
    setShowAddStatusForm(false);
  };

  const latestDate = orderedDates[0];

  // Build the transition blocks: consecutive active dates
  // For orderedDates = ['2026-06-20', '2026-06-19', '2026-06-18', '2026-06-17']
  // We compare index 1 vs index 0, index 2 vs index 1, index 3 vs index 2.
  const blocks: Array<{
    currentDate: string;
    previousDate: string;
    currentLabel: string;
    previousLabel: string;
  }> = [];

  for (let i = 0; i < orderedDates.length - 1; i++) {
    blocks.push({
      currentDate: orderedDates[i],
      previousDate: orderedDates[i + 1],
      currentLabel: formatDateLabel(orderedDates[i]),
      previousLabel: formatDateLabel(orderedDates[i + 1])
    });
  }

  // Double check how many rows are there
  if (orderedDates.length < 1) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        <Info className="w-12 h-12 mx-auto text-slate-300 mb-2" />
        <p className="font-medium text-slate-600">Tidak ada data tanggal tersimpan.</p>
        <p className="text-sm mt-1">Silakan klik &quot;Tambah Tanggal&quot; di atas untuk memulai pengarsipan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-sm text-slate-700">Editor Perhitungan - Klik Angka / Tanggal untuk Mengedit</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusConfig(!showStatusConfig)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 shadow-xs rounded-lg px-3 py-1.5 transition-all"
            id="toggle-status-config"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Atur Status / Baris</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showStatusConfig ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATUS SETUP PANEL */}
      {showStatusConfig && (
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Manajemen Status & Baris</h3>
            <button
              onClick={() => setShowAddStatusForm(!showAddStatusForm)}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs py-1 px-2.5 rounded-md transition-all"
              id="btn-add-status-config"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Status</span>
            </button>
          </div>

          {/* New Status Form */}
          {showAddStatusForm && (
            <form onSubmit={handleAddStatusSubmit} className="bg-white border border-slate-200 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs shadow-inner">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-600">Nama Status</label>
                <input
                  type="text"
                  placeholder="Misal: Merchant Menunggu..."
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="border border-slate-200 rounded px-2.5 py-1.5 focus:border-indigo-400 focus:outline-hidden text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-600">Kategori</label>
                <select
                  value={newStatusCategory}
                  onChange={(e) => setNewStatusCategory(e.target.value as any)}
                  className="border border-slate-200 rounded px-2.5 py-1.5 focus:border-indigo-400 focus:outline-hidden text-sm"
                >
                  <option value="pipeline">Pipeline (Proses)</option>
                  <option value="active">Active (Eksisting)</option>
                  <option value="closed-won">Success (Selesai/Goal)</option>
                  <option value="closed-lost">Lost (Gatal/Ditolak)</option>
                  <option value="other">Other (Lainnya)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-600">Warna Tag</label>
                <div className="grid grid-cols-3 gap-1">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setNewStatusBg(p.bg);
                        setNewStatusColor(p.border);
                      }}
                      className={`py-1 rounded text-[10px] text-center font-medium border transition-all ${p.bg} ${p.border} ${p.text} ${newStatusBg === p.bg ? 'ring-2 ring-indigo-500 scale-103' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-end gap-2 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => setShowAddStatusForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded font-medium"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          )}

          {/* List of current statuses with action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {statuses.map((s) => (
              <div 
                key={s.id} 
                className={`flex items-center justify-between p-2 rounded-lg border ${s.bgClass} ${s.color} shadow-xs`}
              >
                <div className="truncate">
                  <span className={`text-xs font-semibold block truncate ${s.textClass}`}>{s.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{s.category}</span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => {
                      const newName = prompt(`Ubah nama "${s.name}":`, s.name);
                      if (newName && newName.trim()) {
                        onUpdateStatus(s.id, { name: newName.trim() });
                      }
                    }}
                    className="p-1 hover:bg-white/65 rounded text-slate-500 hover:text-slate-800"
                    title="Ubah Nama"
                    type="button"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {statuses.length > 2 && (
                    <button
                      onClick={() => {
                        if (confirm(`Apakah Anda yakin menghapus status "${s.name}"? Ini akan menghapus nilainya di seluruh tanggal.`)) {
                          onDeleteStatus(s.id);
                        }
                      }}
                      className="p-1 hover:bg-rose-100/60 rounded text-rose-500 hover:text-rose-700"
                      title="Hapus Status"
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPREADSHEET TABLE GRID CONTAINER */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            {/* Parent Level Main Headers */}
            <tr className="bg-slate-900 border-b border-slate-800 text-white font-semibold text-xs tracking-wider uppercase">
              <th className="py-3 px-4 text-[13px] font-bold w-[250px] border-r border-slate-800 sticky left-0 bg-slate-900 z-10">
                Status Kunjungan
              </th>

              {/* Dynamic Transition Blocks Pairs */}
              {blocks.length > 0 ? (
                blocks.map((block, idx) => (
                  <React.Fragment key={`${block.previousDate}_${block.currentDate}`}>
                    <th colSpan={3} className={`py-2 px-4 text-center border-r border-slate-800 text-xs ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800'}`}>
                      Perbandingan: {block.previousLabel} Ke {block.currentLabel}
                    </th>
                  </React.Fragment>
                ))
              ) : (
                <th colSpan={3} className="py-2 px-4 text-center text-slate-400 italic">
                  Minimal butuh 2 hari pengamatan
                </th>
              )}

              {/* Individual Dates with no comparison, displayed fallback if only 1 day exists */}
              {blocks.length === 0 && orderedDates.map((date) => (
                <th key={date} className="py-2 px-4 text-center border-r border-slate-800 bg-slate-800">
                  {formatDateLabel(date)}
                </th>
              ))}
            </tr>

            {/* Second Row Excel-like Column Names */}
            <tr className="bg-[#111827] border-b border-slate-800 text-white font-mono text-xs">
              {/* Frozen left column status title */}
              <th className="py-3 px-4 border-r border-slate-800 sticky left-0 bg-[#111827] z-10">
                <span>Daftar Status</span>
              </th>

              {/* Dynamic paired column labels */}
              {blocks.length > 0 ? (
                blocks.map((block) => {
                  const labelPrev = formatDateLabel(block.previousDate);
                  const labelCurr = formatDateLabel(block.currentDate);
                  const isCurrentLatest = block.currentDate === orderedDates[0];

                  return (
                    <React.Fragment key={`sub-${block.currentDate}-${block.previousDate}`}>
                      {/* Previous Date Cell Header */}
                      <th className="py-2.5 px-3 text-right bg-slate-800/90 hover:bg-slate-700/80 transition-colors w-[130px] select-none cursor-pointer group"
                        onClick={() => handleDateClick(block.previousDate)}
                        title="Klik untuk mengubah tanggal ini"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className="truncate">{labelPrev}</span>
                          <Calendar className="w-3 h-3 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>

                      {/* Current Date Cell Header */}
                      <th className={`py-2.5 px-3 text-right text-yellow-400 hover:text-white transition-colors w-[130px] select-none cursor-pointer group ${isCurrentLatest ? 'bg-[#1e293b]' : 'bg-slate-800'}`}
                        onClick={() => handleDateClick(block.currentDate)}
                        title="Klik untuk mengubah tanggal ini"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className="truncate">{labelCurr}</span>
                          <Calendar className="w-3 h-3 text-yellow-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>

                      {/* Delta Label Header */}
                      <th className="py-2.5 px-3 text-right font-semibold bg-slate-900 border-r border-slate-800 w-[110px] text-slate-300">
                        Delta
                      </th>
                    </React.Fragment>
                  );
                })
              ) : (
                /* Backwards compatible fallback headers */
                orderedDates.map((date) => (
                  <th key={`fallback-${date}`} className="py-2.5 px-3 text-right bg-slate-800 hover:bg-slate-700 cursor-pointer text-yellow-300"
                    onClick={() => handleDateClick(date)}
                  >
                    {formatDateLabel(date)}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {/* Status Rows */}
            {statuses.map((status) => {
              return (
                <tr 
                  key={status.id} 
                  className="border-b border-slate-200/60 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Status Cell Name (Sticky Left, same as image layout) */}
                  <td className="py-2 px-4 border-r border-slate-200/80 font-medium text-slate-900 sticky left-0 bg-white shadow-xs z-10 w-[250px] text-sm">
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-1">{status.name}</span>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full border border-slate-300 ${status.bgClass.split(' ')[0]}`} />
                    </div>
                  </td>

                  {/* Dynamic Values block matching row status */}
                  {blocks.length > 0 ? (
                    blocks.map((block) => {
                      const valPrev = records[block.previousDate]?.[status.id] ?? 0;
                      const valCurr = records[block.currentDate]?.[status.id] ?? 0;
                      const delta = valCurr - valPrev;

                      const isEditingPrev = editingCell?.date === block.previousDate && editingCell?.statusId === status.id;
                      const isEditingCurr = editingCell?.date === block.currentDate && editingCell?.statusId === status.id;

                      return (
                        <React.Fragment key={`cells-${status.id}-${block.previousDate}-${block.currentDate}`}>
                          {/* Previous Date Value */}
                          <td 
                            className={`py-2 px-3 text-right border-r border-slate-100 text-sm font-mono cursor-pointer transition-all select-none hover:brightness-95 ${status.bgClass} ${status.textClass} ${isEditingPrev ? 'p-1 hover:brightness-100 ring-2 ring-indigo-500 z-20' : ''}`}
                            onClick={() => handleCellClick(block.previousDate, status.id, valPrev)}
                          >
                            {isEditingPrev ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={handleKeyDown}
                                className="w-full text-right bg-white text-slate-900 px-2.5 py-1 border border-indigo-400 rounded focus:outline-hidden font-mono"
                                autoFocus
                              />
                            ) : (
                              formatIndonesianNumber(valPrev)
                            )}
                          </td>

                          {/* Current Date Value */}
                          <td 
                            className={`py-2 px-3 text-right border-r border-slate-200 text-sm font-mono cursor-pointer transition-all select-none hover:brightness-95 ${status.bgClass} ${status.textClass} ${isEditingCurr ? 'p-1 hover:brightness-100 ring-2 ring-indigo-500 z-20' : ''}`}
                            onClick={() => handleCellClick(block.currentDate, status.id, valCurr)}
                          >
                            {isEditingCurr ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={handleKeyDown}
                                className="w-full text-right bg-white text-slate-900 px-2.5 py-1 border border-indigo-400 rounded focus:outline-hidden font-mono"
                                autoFocus
                              />
                            ) : (
                              formatIndonesianNumber(valCurr)
                            )}
                          </td>

                          {/* Delta Change (Neutral backgound, Bold if modified, just like in image) */}
                          <td className={`py-2 px-3 text-right border-r border-slate-200 text-sm font-mono bg-white font-bold select-none ${delta !== 0 ? 'text-slate-900 bg-slate-50/40' : 'text-slate-400 font-normal'}`}>
                            {formatDelta(delta)}
                          </td>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    /* Display individual entries fallback */
                    orderedDates.map((date) => {
                      const val = records[date]?.[status.id] ?? 0;
                      const isEditing = editingCell?.date === date && editingCell?.statusId === status.id;

                      return (
                        <td 
                          key={`row-cell-${date}`}
                          className={`py-2 px-3 text-right border-r border-slate-200 text-sm font-mono cursor-pointer hover:bg-slate-100 select-none ${status.bgClass} ${status.textClass} ${isEditing ? 'ring-2 ring-indigo-500' : ''}`}
                          onClick={() => handleCellClick(date, status.id, val)}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellSave}
                              onKeyDown={handleKeyDown}
                              className="w-full text-right px-2 py-0.5 border border-indigo-400 rounded font-mono"
                              autoFocus
                            />
                          ) : (
                            formatIndonesianNumber(val)
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}

            {/* TOTAL SUM ROW (Styled identical to the image table bottom row) */}
            <tr className="bg-black text-white font-extrabold text-[13px] border-t-2 border-slate-950 font-mono">
              {/* Sticky bottom total title */}
              <td className="py-3 px-4 border-r border-slate-800 sticky left-0 bg-black z-10 font-sans tracking-wide uppercase">
                Total
              </td>

              {/* Render computed totals for each Block and Date */}
              {blocks.length > 0 ? (
                blocks.map((block) => {
                  const totalPrev = calculateDateTotal(records[block.previousDate] || {}, statuses);
                  const totalCurr = calculateDateTotal(records[block.currentDate] || {}, statuses);
                  const totalDelta = totalCurr - totalPrev;

                  return (
                    <React.Fragment key={`tot-block-${block.currentDate}-${block.previousDate}`}>
                      {/* Previous total */}
                      <td className="py-3 px-3 text-right border-r border-slate-800 font-bold bg-[#111827]">
                        {formatIndonesianNumber(totalPrev)}
                      </td>

                      {/* Current total */}
                      <td className="py-3 px-3 text-right border-r border-slate-800 font-bold bg-[#111827]">
                        {formatIndonesianNumber(totalCurr)}
                      </td>

                      {/* Total Delta (should always be '-' if they balance their changes perfectly!) */}
                      <td className={`py-3 px-3 text-right border-r border-slate-800 font-extrabold bg-black ${totalDelta !== 0 ? 'text-amber-400 underline font-extrabold' : 'text-slate-400'}`}>
                        {formatDelta(totalDelta)}
                      </td>
                    </React.Fragment>
                  );
                })
              ) : (
                orderedDates.map((date) => {
                  const total = calculateDateTotal(records[date] || {}, statuses);
                  return (
                    <td key={`tot-${date}`} className="py-3 px-3 text-right border-r border-slate-800 font-bold bg-[#111827]">
                      {formatIndonesianNumber(total)}
                    </td>
                  );
                })
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER ADVICE */}
      <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>Klik angka untuk edit nilai. Klik tanggal di header untuk edit tanggal.</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span>Target Total Pool Seimbang:</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
            {latestDate ? formatIndonesianNumber(calculateDateTotal(records[latestDate] || {}, statuses)) : '0'}
          </span>
        </div>
      </div>

      {/* POPUP: DATE PICKER DIALOG */}
      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Ubah Tanggal</span>
              </h3>
              <button 
                onClick={() => setEditingDate(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              Silakan ganti tanggal untuk kolom ini. Format input standard adalah tanggal input. Seluruh data historis untuk kolom ini akan dipetakan ke tanggal baru.
            </p>

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-xs font-bold text-slate-600">Pilih Tanggal Baru</label>
              <input
                type="date"
                value={newDateInput}
                onChange={(e) => setNewDateInput(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin menghapus seluruh kolom tanggal ini dari tabel?')) {
                    onDeleteDate(editingDate);
                    setEditingDate(null);
                  }
                }}
                disabled={orderedDates.length <= 1}
                className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs py-2 px-3 rounded-md transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Kolom</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDate(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDateSave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-semibold text-xs shadow-sm"
                >
                  Ubah Tanggal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
