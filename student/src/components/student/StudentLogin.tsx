import React, { useState } from 'react';
import { celebrate } from '../../lib/celebrate';
import { 
  GraduationCap, 
  ArrowRight, 
  AlertCircle, 
  UserCheck, 
  Lock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../BrandLogo';

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
      celebrate();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your Roll Number and Password.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans">
      
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <BrandLogo className="h-28 w-28 mx-auto mb-3 object-contain mix-blend-multiply" fallback={
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20 mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        } />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
          MBA Student Login
        </h1>
      </div>

      {/* Standalone Student Login Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your Account</h2>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
              e.g. 25MBA001
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


      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        MBA Activities Management System &bull; Student Web Application
      </div>

    </div>
  );
};
