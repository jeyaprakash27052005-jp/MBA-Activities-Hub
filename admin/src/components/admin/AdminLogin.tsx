import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../BrandLogo';

export const AdminLogin: React.FC = () => {
  const { loginAsHeadAdmin } = useAuth();
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAsHeadAdmin(adminPass);
    } catch (err: any) {
      setError(err?.message || 'Invalid login.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans">
      
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <BrandLogo className="h-16 w-auto mx-auto mb-3 object-contain" fallback={
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-purple-500/20 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        } />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
          Head Admin Command
        </h1>
      </div>

      {/* Standalone Head Admin Login Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Administrator Sign In</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full governance, position allocation, and on/off feature controls
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
              Admin Password *
            </label>
            <input
              type="password"
              required
              placeholder="Enter password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
          >
            <span>{loading ? 'Submitting...' : 'Submit'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        MBA Activities Management System &bull; Head Administration Web Application
      </div>

    </div>
  );
};
