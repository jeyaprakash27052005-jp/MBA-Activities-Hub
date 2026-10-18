import React, { useEffect, useState } from 'react';
import { Layers, Check, AlertCircle } from 'lucide-react';
import { BatchConfig } from '../types';
import { addNextBatch, subscribeToBatches, DEFAULT_BATCHES } from '../services/userService';

// Lets faculty / Head Admin register the NEXT batch (e.g. 26MBA001 - 26MBA175) and create all its student IDs.
export const NextBatchForm: React.FC = () => {
  const yy = new Date().getFullYear() % 100;
  const [batches, setBatches] = useState<BatchConfig[]>(DEFAULT_BATCHES);
  const [prefix, setPrefix] = useState(`${yy}MBA`);
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(175);
  const [year, setYear] = useState(`1st Year (20${yy}-20${yy + 2})`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToBatches(setBatches), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const code = prefix.trim().toUpperCase();
      const res = await addNextBatch(code, start, end, year);
      const pad = (n: number) => String(n).padStart(3, '0');
      setMessage(
        `Batch ${code} ready: ${res.created} new student IDs created (${code}${pad(start)} to ${code}${pad(end)})` +
        (res.skipped > 0 ? `, ${res.skipped} already existed and were left unchanged` : '') +
        '. Each student\'s first password is their Roll Number.'
      );
    } catch (err: any) {
      setError(err?.message || 'Could not create the batch.');
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4 max-w-2xl">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Add Next Batch Student IDs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Creates the Roll Numbers for a new batch. Only IDs created here (or by the Head Admin) can log in.
            Everyone starts as a Member; positions are assigned afterwards.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Code *</label>
              <input type="text" required value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="26MBA" className={`${input} font-mono font-bold uppercase`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">From Roll No. *</label>
              <input type="number" required min={1} max={999} value={start} onChange={(e) => setStart(parseInt(e.target.value || '0', 10))} className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To Roll No. *</label>
              <input type="number" required min={1} max={999} value={end} onChange={(e) => setEnd(parseInt(e.target.value || '0', 10))} className={input} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Year of Studying *</label>
            <input type="text" required value={year} onChange={(e) => setYear(e.target.value)} className={input} />
          </div>
          <p className="text-[11px] text-slate-500">
            Preview: <span className="font-mono font-bold text-indigo-600">{prefix || '--MBA'}{String(start || 0).padStart(3, '0')}</span> to{' '}
            <span className="font-mono font-bold text-indigo-600">{prefix || '--MBA'}{String(end || 0).padStart(3, '0')}</span>
          </p>
          <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50">
            {busy ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm max-w-2xl">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Batches that can log in</span>
        <div className="flex flex-wrap gap-2">
          {batches.map((b) => (
            <span key={b.prefix} className="px-3 py-1 rounded-lg text-xs bg-indigo-50 text-indigo-800 border border-indigo-100 font-mono font-bold">
              {b.prefix}{String(b.start).padStart(3, '0')} - {b.prefix}{String(b.end).padStart(3, '0')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
