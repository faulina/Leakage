/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  FileDown, 
  Upload, 
  Download, 
  FileText, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { StatusDefinition } from '../types';
import { generateExcelWorkbook, parseExcelWorkbook } from '../utils';

interface DataImporterExporterProps {
  statuses: StatusDefinition[];
  records: Record<string, Record<string, number>>;
  orderedDates: string[];
  onImportData: (dates: string[], values: Record<string, Record<string, number>>) => void;
}

export default function DataImporterExporter({
  statuses,
  records,
  orderedDates,
  onImportData
}: DataImporterExporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExportExcel = () => {
    try {
      const buffer = generateExcelWorkbook(statuses, records, orderedDates);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Progres_Harian_Prioritas_1_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMsg('Ekspor Excel Berhasil!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(`Ekspor Excel Gagal: ${(err as Error).message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const result = parseExcelWorkbook(buffer);
      
      if (result.error) {
        setErrorMsg(result.error);
        setSuccessMsg(null);
      } else {
        onImportData(result.dates, result.values);
        setSuccessMsg('Data Excel Berhasil Diimpor!');
        setErrorMsg(null);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca berkas Excel.');
    };
    reader.readAsArrayBuffer(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyTemplate = () => {
    try {
      const header = ['Status', ...orderedDates];
      const rows = [header.join('\t')];
      statuses.forEach((s) => {
        const row = [s.name, ...orderedDates.map(d => records[d]?.[s.id] ?? 0)];
        rows.push(row.join('\t'));
      });

      const textToCopy = rows.join('\n');
      
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch((err) => {
            console.warn('Clipboard write failed, falling back to document selector.', err);
            fallbackCopy(textToCopy);
          });
      } else {
        fallbackCopy(textToCopy);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setErrorMsg('Gagal menyalin data otomatis. Silakan coba mengunduh file Excel.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Position offscreen
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('document.execCommand returned false');
      }
    } catch (err) {
      console.error('Fallback copy method failed:', err);
      setErrorMsg('Metode salin otomatis diblokir peramban. Silakan gunakan tombol Unduh Excel.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            <span>Ekspor / Impor Excel (.xlsx)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simpan data ke format Excel atau unggah file Excel Anda untuk sinkronisasi otomatis.
          </p>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Table Template button */}
          <button
            onClick={handleCopyTemplate}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs px-3 py-2 rounded-lg transition-all"
            title="Salin data ke clipboard untuk ditempel di Excel atau Sheets"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Salin Spreadsheet</span>
              </>
            )}
          </button>

          {/* Trigger File Input */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 shadow-xs px-3 py-2 rounded-lg transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Unggah Excel</span>
          </button>

          {/* File input invisible */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx"
            className="hidden"
          />

          {/* Download Excel button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shadow-xs px-4 py-2 rounded-lg transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS MESSAGES */}
      {(errorMsg || successMsg) && (
        <div className="mt-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* DETAILED USER GUIDE HELPDESK */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span>Panduan Penggunaan</span>
        </h4>
        <ul className="list-disc pl-5 text-[11px] text-slate-500 space-y-1">
          <li><strong>Delta Otomatis:</strong> Nilai Delta kolom dihitung instan dari pergeseran hari berurutan.</li>
          <li><strong>Interoperabilitas Excel:</strong> Anda dapat mengklik &quot;Salin Spreadsheet&quot;, lalu mem-paste (Ctrl + V) di MS Excel atau Sheets.</li>
        </ul>
      </div>
    </div>
  );
}
