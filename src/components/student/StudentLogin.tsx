import React, { useState } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  AlertCircle, 
  UserCheck, 
  Lock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentLogin: React.FC = () => {
  const { loginWithRollNumber } = useAuth();
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithRollNumber(studentRoll, studentPass);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your Roll Number and Password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roll: string, pass: string) => {
    setStudentRoll(roll);
    setStudentPass(pass);
    setError(null);
    setLoading(true);
    try {
      await loginWithRollNumber(roll, pass);
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans">
      
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20 mb-3">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
          Official MBA Student Web App
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2">
          MBA Student Login
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Club Event Agendas &bull; 8 Participants &bull; Executive Operations
        </p>
      </div>

      {/* Standalone Student Login Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your Account</h2>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
              25MBA001 - 25MBA175
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Applicable for Secretary, Executive & Member positions
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Student Roll Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 25MBA001"
              value={studentRoll}
              onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-wider bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-semibold"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Password *
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                (Default: your Roll Number)
              </span>
            </div>
            <input
              type="password"
              required
              placeholder="Enter password"
              value={studentPass}
              onChange={(e) => setStudentPass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
          >
            <span>{loading ? 'Submitting...' : 'Submit'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Testing Profiles */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Quick 1-Click Student Login (Demo Profiles):
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickLogin('25MBA001', '25MBA001')}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-center font-semibold transition-colors"
            >
              <div className="font-mono text-indigo-600 font-bold">25MBA001</div>
              <div className="text-[10px] text-amber-700">Secretary</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('25MBA002', '25MBA002')}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-center font-semibold transition-colors"
            >
              <div className="font-mono text-indigo-600 font-bold">25MBA002</div>
              <div className="text-[10px] text-emerald-700">Executive</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('25MBA005', '25MBA005')}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-center font-semibold transition-colors"
            >
              <div className="font-mono text-indigo-600 font-bold">25MBA005</div>
              <div className="text-[10px] text-slate-500">Member</div>
            </button>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        MBA Activities Management System &bull; Student Web Application
      </div>

    </div>
  );
};
