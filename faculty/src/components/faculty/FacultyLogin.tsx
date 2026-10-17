import React, { useState } from 'react';
import { 
  Building, 
  ArrowRight, 
  AlertCircle, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FacultyLogin: React.FC = () => {
  const { loginWithFacultyCredentials } = useAuth();
  const [facultyId, setFacultyId] = useState('');
  const [facultyPass, setFacultyPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithFacultyCredentials(facultyId, facultyPass);
    } catch (err: any) {
      setError(err?.message || 'Faculty login failed. Check your Faculty ID and Password.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans">
      
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-blue-500/20 mb-3">
          <Building className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
          Faculty Portal Login
        </h1>
      </div>

      {/* Standalone Faculty Login Box */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Faculty Credentials</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sign in to manage student position allocation and club categories
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
              Faculty ID or Email *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FAC001 or faculty@mba.edu"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="Enter faculty password"
              value={facultyPass}
              onChange={(e) => setFacultyPass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
          >
            <span>{loading ? 'Submitting...' : 'Submit'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        MBA Activities Management System &bull; Faculty Web Application
      </div>

    </div>
  );
};
