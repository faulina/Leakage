/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatusDefinition, DateRecord } from './types';
import * as XLSX from 'xlsx';

// Helper to format numbers with dot thousands separators (Indonesian standard, e.g. 14.809)
export function formatIndonesianNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

// Helper to format Delta values: +x, (x) for negative, or - for zero
export function formatDelta(val: number): string {
  if (val === 0) return '-';
  if (val > 0) return `+${formatIndonesianNumber(val)}`;
  return `(${formatIndonesianNumber(Math.abs(val))})`;
}

// Format date string 'YYYY-MM-DD' into 'DD MMM YY' (e.g., '20 Jun 26')
export function formatDateLabel(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) return dateStr;
    
    const months = ['Jun', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    // Let's check for standard month translations in Indonesian corporate style
    const mStr = months[parseInt(month) - 1] || 'Jan';
    const yy = year.substring(2);
    return `${parseInt(day)} ${mStr} ${yy}`;
  } catch {
    return dateStr;
  }
}

// Initial status definitions matching the screenshot perfectly with sleek modern coloring
export const DEFAULT_STATUSES: StatusDefinition[] = [
  {
    id: 'merchant-existing',
    name: 'Merchant Eksisting',
    category: 'active',
    color: 'border-emerald-200',
    textClass: 'text-emerald-950 font-medium',
    bgClass: 'bg-[#daf7dc]/80' // Beautiful light pastel corporate green
  },
  {
    id: 'done-akuisisi',
    name: 'Done Akuisisi',
    category: 'closed-won',
    color: 'border-emerald-200',
    textClass: 'text-emerald-900',
    bgClass: 'bg-[#daf7dc]/60' // Slightly lighter green
  },
  {
    id: 'deal-collect',
    name: 'Deal (On Progress Collect Dokumen)',
    category: 'closed-won',
    color: 'border-yellow-200',
    textClass: 'text-yellow-950 font-medium',
    bgClass: 'bg-[#ffff8c]/80' // Bright friendly corporate yellow
  },
  {
    id: 'penawaran',
    name: 'Penawaran',
    category: 'pipeline',
    color: 'border-amber-200',
    textClass: 'text-amber-950',
    bgClass: 'bg-[#fce5bd]/80' // Warm pastel orange-yellow
  },
  {
    id: 'kunjungan-awal',
    name: 'Kunjungan Awal',
    category: 'pipeline',
    color: 'border-amber-200',
    textClass: 'text-amber-900',
    bgClass: 'bg-[#fce5bd]/60' // Lighter orange-yellow
  },
  {
    id: 'merchant-menolak',
    name: 'Merchant Menolak',
    category: 'closed-lost',
    color: 'border-slate-200',
    textClass: 'text-slate-800',
    bgClass: 'bg-slate-100/70' // Professional neutral soft grey
  },
  {
    id: 'merchant-tutup',
    name: 'Merchant Tutup Permanen',
    category: 'closed-lost',
    color: 'border-slate-200',
    textClass: 'text-slate-800',
    bgClass: 'bg-slate-100/60'
  },
  {
    id: 'merchant-tidak-temu',
    name: 'Merchant Tidak Di Temukan',
    category: 'closed-lost',
    color: 'border-slate-200',
    textClass: 'text-slate-800',
    bgClass: 'bg-slate-100/50'
  },
  {
    id: 'data-leakage',
    name: 'Data Leakage Salah',
    category: 'other',
    color: 'border-slate-200',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100/40'
  },
  {
    id: 'belum-kunjungan',
    name: 'Belum Kunjungan',
    category: 'pipeline',
    color: 'border-slate-300',
    textClass: 'text-slate-900 font-medium',
    bgClass: 'bg-[#ebebeb]/90' // Classic grey
  },
  {
    id: 'done-deal-program',
    name: 'Done Deal Program',
    category: 'closed-won',
    color: 'border-slate-200',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100/30'
  }
];

// Default historical record entries (from June 17, 18, 19, and 20, 2026)
export const DEFAULT_RECORDS: Record<string, Record<string, number>> = {
  '2026-06-20': {
    'merchant-existing': 14826,
    'done-akuisisi': 3790,
    'deal-collect': 98,
    'penawaran': 14210,
    'kunjungan-awal': 14043,
    'merchant-menolak': 8500,
    'merchant-tutup': 536,
    'merchant-tidak-temu': 4044,
    'data-leakage': 3293,
    'belum-kunjungan': 9894,
    'done-deal-program': 15
  },
  '2026-06-19': {
    'merchant-existing': 14809,
    'done-akuisisi': 3787,
    'deal-collect': 97,
    'penawaran': 14083,
    'kunjungan-awal': 13985,
    'merchant-menolak': 8474,
    'merchant-tutup': 535,
    'merchant-tidak-temu': 4042,
    'data-leakage': 3288,
    'belum-kunjungan': 10134,
    'done-deal-program': 15
  },
  '2026-06-18': {
    'merchant-existing': 14790,
    'done-akuisisi': 3721,
    'deal-collect': 91,
    'penawaran': 14114,
    'kunjungan-awal': 13793,
    'merchant-menolak': 8409,
    'merchant-tutup': 531,
    'merchant-tidak-temu': 3913,
    'data-leakage': 3244,
    'belum-kunjungan': 10627,
    'done-deal-program': 16
  },
  '2026-06-17': {
    'merchant-existing': 14801,
    'done-akuisisi': 3627,
    'deal-collect': 94,
    'penawaran': 14145,
    'kunjungan-awal': 13632,
    'merchant-menolak': 8335,
    'merchant-tutup': 528,
    'merchant-tidak-temu': 3773,
    'data-leakage': 3141,
    'belum-kunjungan': 11157,
    'done-deal-program': 16
  }
};

export const DEFAULT_ORDERED_DATES = ['2026-06-20', '2026-06-19', '2026-06-18', '2026-06-17'];

// Calculate sum total of counts for a specific date
export function calculateDateTotal(values: Record<string, number>, statuses: StatusDefinition[]): number {
  return statuses.reduce((sum, s) => sum + (values[s.id] || 0), 0);
}

// Generate Excel binary representing the spreadsheet
export function generateExcelWorkbook(
  statuses: StatusDefinition[],
  records: Record<string, Record<string, number>>,
  orderedDates: string[]
): ArrayBuffer {
  // Column Headers: Status, and ordered dates
  const headers = ['Status', ...orderedDates];
  
  // Format rows
  const rows = statuses.map((s) => {
    const rowObj: Record<string, any> = {
      'Status': s.name
    };
    orderedDates.forEach((d) => {
      rowObj[d] = records[d]?.[s.id] ?? 0;
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  
  // Excel formatting: auto adjust column widths
  const maxW = [{ wch: 30 }, ...orderedDates.map(() => ({ wch: 15 }))];
  worksheet['!cols'] = maxW;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Progres Harian');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return excelBuffer;
}

// Read and parse imported Excel content safely
export function parseExcelWorkbook(
  fileBuffer: ArrayBuffer
): { error?: string; dates: string[]; values: Record<string, Record<string, number>> } {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { error: 'Format berkas Excel kosong.', dates: [], values: {} };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    if (jsonData.length === 0) {
      return { error: 'Excel tidak memiliki data status.', dates: [], values: {} };
    }

    // Capture keys to read date columns
    const keys = Object.keys(jsonData[0]);
    const dates = keys.filter((k) => k !== 'Status');

    if (dates.length === 0) {
      return { error: 'Tidak ditemukan kolom tanggal pengamatan setelah kolom Status.', dates: [], values: {} };
    }

    const values: Record<string, Record<string, number>> = {};
    dates.forEach((d) => {
      values[d] = {};
    });

    jsonData.forEach((row) => {
      const statusName = row['Status'];
      if (!statusName) return;
      const statusId = statusName.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '-');

      dates.forEach((d) => {
        let val = row[d];
        if (typeof val === 'string') {
          val = parseInt(val.replace(/[^0-9-]/g, '')) || 0;
        } else if (typeof val !== 'number') {
          val = 0;
        }
        if (!values[d]) {
          values[d] = {};
        }
        values[d][statusId] = Math.max(0, val);
      });
    });

    return { dates, values };
  } catch (err) {
    return { error: `Gagal membaca berkas Excel: ${(err as Error).message}`, dates: [], values: {} };
  }
}
