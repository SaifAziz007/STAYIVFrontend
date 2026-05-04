'use client';

import { useCallback, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  bulkImportApi,
  type AutoMatchResult,
  type BulkImportParseResponse,
  type ImportMatch,
  type ImportResult,
  type Property,
} from '@/lib/properties-api';

type Step = 'upload' | 'match' | 'importing' | 'done';

interface ColumnMatch {
  columnIndex: number;
  columnLabel: string;
  columnAddress?: string;
  selectedPropertyId: string | null;
  confidence: number;
  suggestedPropertyName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  properties: Property[];
  onImportComplete: () => void;
}

export function BulkImportModal({ open, onClose, properties, onImportComplete }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResponse, setParseResponse] = useState<BulkImportParseResponse | null>(null);
  const [columnMatches, setColumnMatches] = useState<ColumnMatch[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setIsDragging(false);
    setSelectedFile(null);
    setParseResponse(null);
    setColumnMatches([]);
    setImportResults([]);
    setImportSummary(null);
    setUploadLoading(false);
    setImportLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ─── Step 1: File Upload ─────────────────────────────────────────────

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload a .xlsx, .xls, or .csv file');
      return;
    }
    setSelectedFile(file);
    setUploadLoading(true);
    try {
      const response = await bulkImportApi.parseColumns(file);
      setParseResponse(response);
      const matches: ColumnMatch[] = response.autoMatches.map((am: AutoMatchResult) => ({
        columnIndex: am.column.columnIndex,
        columnLabel: am.column.label,
        columnAddress: am.column.address,
        selectedPropertyId: am.matchedPropertyId ?? null,
        confidence: am.confidence,
        suggestedPropertyName: am.matchedPropertyName,
      }));
      setColumnMatches(matches);
      setStep('match');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to parse Excel file. Please check the format.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // ─── Step 2: Matching ────────────────────────────────────────────────

  const updateMatch = (columnIndex: number, propertyId: string | null) => {
    setColumnMatches((prev) =>
      prev.map((m) => (m.columnIndex === columnIndex ? { ...m, selectedPropertyId: propertyId } : m)),
    );
  };

  const getSelectedPropertyIds = () =>
    new Set(columnMatches.map((m) => m.selectedPropertyId).filter(Boolean));

  const getReadyCount = () => columnMatches.filter((m) => m.selectedPropertyId).length;

  const propertyAlreadyHasData = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    return (prop?.propertySheet?.overallCompletion ?? 0) > 0;
  };

  // ─── Step 3: Execute Import ──────────────────────────────────────────

  const executeImport = async (matchesToRun?: ColumnMatch[]) => {
    if (!parseResponse) return;
    const toImport = matchesToRun ?? columnMatches.filter((m) => m.selectedPropertyId);
    const matches: ImportMatch[] = toImport
      .filter((m) => m.selectedPropertyId)
      .map((m) => ({ columnIndex: m.columnIndex, propertyId: m.selectedPropertyId! }));

    setImportLoading(true);
    setStep('importing');
    setImportResults(
      matches.map((m) => {
        const col = columnMatches.find((c) => c.columnIndex === m.columnIndex);
        const prop = properties.find((p) => p.id === m.propertyId);
        return {
          propertyId: m.propertyId,
          propertyName: (prop?.propertySheet?.identityData as any)?.propertyName || m.propertyId,
          columnLabel: col?.columnLabel || '',
          status: 'failed' as const,
          modulesUpdated: 0,
          error: 'pending',
        };
      }),
    );

    try {
      const response = await bulkImportApi.execute(parseResponse.fileData, matches);
      setImportResults(response.results);
      setImportSummary(response.summary);
      setStep('done');
      if (response.summary.success > 0) onImportComplete();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed. Please try again.');
      setStep('match');
    } finally {
      setImportLoading(false);
    }
  };

  const retryFailed = () => {
    const failed = importResults.filter((r) => r.status === 'failed');
    const failedMatches = columnMatches.filter((m) =>
      failed.some((f) => f.propertyId === m.selectedPropertyId),
    );
    if (failedMatches.length > 0) executeImport(failedMatches);
  };

  const usedPropertyIds = getSelectedPropertyIds();

  const stepTitles: Record<Step, string> = {
    upload: 'Bulk Import Properties',
    match: 'Match Excel Columns to Properties',
    importing: 'Importing Properties...',
    done: 'Import Complete',
  };

  const stepDescs: Record<Step, string> = {
    upload: 'Upload your Excel property sheet to automatically fill all 9 modules using AI.',
    match: `Found ${columnMatches.length} properties in the Excel. Match each to a property in your account.`,
    importing: 'DeepSeek AI is extracting data for each property. Please wait...',
    done: `Import finished. ${importSummary?.success ?? 0} of ${importSummary?.total ?? 0} properties updated successfully.`,
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col gap-0">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{stepTitles[step]}</DialogTitle>
          <DialogDescription className="text-sm mt-1">{stepDescs[step]}</DialogDescription>
        </DialogHeader>

        {/* ─── Step 1: Upload ─────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4 py-2">
            <div
              className={`border-2 border-dashed rounded-xl px-6 py-12 flex flex-col items-center gap-3 cursor-pointer transition-colors
                ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-gray-300 dark:border-border hover:border-blue-400 hover:bg-blue-500/5'}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className={`${isDragging ? 'text-blue-500' : 'text-gray-400'}`} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-base font-medium text-gray-700 dark:text-foreground m-0">
                {uploadLoading ? 'Parsing Excel file...' : 'Drag & drop your Excel file here'}
              </p>
              <p className="text-sm text-gray-400 m-0">or click to browse — .xlsx, .xls, .csv accepted</p>
              {uploadLoading && (
                <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-200 dark:border-blue-900 rounded-lg px-3.5 py-2.5 text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
              <span>💡</span>
              <span>Your Excel should have property names in row 2 and field labels in columns B/C. One column per property.</span>
            </div>
          </div>
        )}

        {/* ─── Step 2: Match ──────────────────────────────────────────── */}
        {step === 'match' && (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex justify-end">
              <span className="text-xs font-medium text-gray-500">
                {getReadyCount()} of {columnMatches.length} ready to import
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
              {columnMatches.map((col) => {
                const isOverwrite = col.selectedPropertyId ? propertyAlreadyHasData(col.selectedPropertyId) : false;
                return (
                  <div key={col.columnIndex} className="grid grid-cols-[1fr_20px_1fr] items-center gap-2.5 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-lg px-3 py-2.5">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">{col.columnLabel}</span>
                      {col.columnAddress && <span className="text-xs text-gray-500 truncate">{col.columnAddress}</span>}
                      {col.confidence >= 50 && col.suggestedPropertyName && (
                        <span className="text-[11px] text-emerald-600 font-medium">{col.confidence}% match: {col.suggestedPropertyName}</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm text-center">→</span>
                    <div className="flex flex-col gap-1">
                      <select
                        className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-border rounded-md text-sm bg-white dark:bg-background text-gray-900 dark:text-foreground outline-none cursor-pointer focus:border-blue-500"
                        value={col.selectedPropertyId ?? ''}
                        onChange={(e) => updateMatch(col.columnIndex, e.target.value || null)}
                      >
                        <option value="">— Skip this column —</option>
                        {properties.map((p) => {
                          const name = (p.propertySheet?.identityData as any)?.propertyName || `Property ${p.id.slice(0, 8)}`;
                          const alreadyUsed = usedPropertyIds.has(p.id) && p.id !== col.selectedPropertyId;
                          return (
                            <option key={p.id} value={p.id} disabled={alreadyUsed}>
                              {name}{alreadyUsed ? ' (already matched)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {isOverwrite && (
                        <span className="text-[11px] text-amber-600 font-medium">⚠ Has existing data — will overwrite</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-200 dark:border-border">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={() => executeImport()}
                disabled={getReadyCount() === 0 || importLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
              >
                Confirm & Import ({getReadyCount()})
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Importing ──────────────────────────────────────── */}
        {step === 'importing' && (
          <div className="flex flex-col gap-2 py-1 max-h-[400px] overflow-y-auto">
            {columnMatches.filter((m) => m.selectedPropertyId).map((m) => {
              const prop = properties.find((p) => p.id === m.selectedPropertyId);
              const propName = (prop?.propertySheet?.identityData as any)?.propertyName || m.selectedPropertyId;
              const result = importResults.find((r) => r.propertyId === m.selectedPropertyId);
              const isPending = !result || result.error === 'pending';

              return (
                <div key={m.columnIndex} className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-lg">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {isPending ? (
                      <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    ) : result?.status === 'success' ? (
                      <span className="text-emerald-600 font-bold text-sm">✓</span>
                    ) : (
                      <span className="text-red-500 font-bold text-sm">✗</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-foreground">{propName}</span>
                    <span className="text-xs text-gray-500">
                      {isPending ? 'Processing...' : result?.status === 'success' ? `${result.modulesUpdated}/9 modules filled` : result?.error || 'Failed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Step 4: Done ───────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 p-4 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl">
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-emerald-600">{importSummary?.success ?? 0}</span>
                <span className="text-xs text-gray-500 font-medium">Successful</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-red-500">{importSummary?.failed ?? 0}</span>
                <span className="text-xs text-gray-500 font-medium">Failed</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-foreground">{importSummary?.total ?? 0}</span>
                <span className="text-xs text-gray-500 font-medium">Total</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
              {importResults.map((r) => (
                <div key={r.propertyId} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${r.status === 'success' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                  <span className={`text-sm font-bold w-5 text-center ${r.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {r.status === 'success' ? '✓' : '✗'}
                  </span>
                  <div className="flex flex-col gap-0 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-foreground">{r.propertyName}</span>
                    <span className="text-xs text-gray-500">{r.status === 'success' ? `${r.modulesUpdated}/9 modules updated` : r.error}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-200 dark:border-border">
              {(importSummary?.failed ?? 0) > 0 && (
                <Button variant="outline" onClick={retryFailed}>
                  Retry Failed ({importSummary?.failed})
                </Button>
              )}
              <Button onClick={handleClose} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
