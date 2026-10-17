import React, { useState } from 'react';
import { 
  GraduationCap, 
  Building, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  UserCheck, 
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { loginWithRollNumber, loginWithFacultyCredentials, loginAsHeadAdmin } = useAuth();

  // Mode: null (portal selector) | 'student' | 'faculty' | 'admin'
  const [selectedPortal, setSelectedPortal] = useState<'student' | 'faculty' | 'admin' | null>(null);

  // Student credentials
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPass, setStudentPass] = useState('');

  // Faculty credentials
  const [facultyId, setFacultyId] = useState('');
  const [facultyPass, setFacultyPass] = useState('');

  // Head Admin credentials
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
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

  const handleFacultyLogin = async (e: React.FormEvent) => {
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAsHeadAdmin(adminUser, adminPass);
    } catch (err: any) {
      setError(err?.message || 'Head Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans">
      
      {/* Brand Header */}
      <div className="text-center mb-8 max-w-lg">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20 mb-3">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          MBA Department Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Club Event Agendas &bull; Participant Rosters &bull; Executive Operations
        </p>
      </div>

      {/* PORTAL SELECTOR (If no portal chosen) */}
      {selectedPortal === null && (
        <div className="w-full max-w-3xl space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-base font-bold text-slate-700">
              Select Your Official Login Portal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Please choose your authorized institutional role to proceed
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Student Portal Card */}
            <div 
              onClick={() => { setSelectedPortal('student'); setError(null); }}
              className="group cursor-pointer bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-600 shadow-sm hover:shadow-lg transition-all text-center flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    MBA Student
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Secretary, Executive & Members (25MBA001 - 25MBA175)
                  </p>
                </div>
              </div>
              <button className="mt-5 w-full py-2 rounded-xl text-xs font-bold bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white transition-colors flex items-center justify-center gap-1.5">
                <span>Student Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Faculty Portal Card */}
            <div 
              onClick={() => { setSelectedPortal('faculty'); setError(null); }}
              className="group cursor-pointer bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-lg transition-all text-center flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Faculty Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Faculty Advisors, Club Mentors & Department Incharges
                  </p>
                </div>
              </div>
              <button className="mt-5 w-full py-2 rounded-xl text-xs font-bold bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white transition-colors flex items-center justify-center gap-1.5">
                <span>Faculty Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Head Admin Portal Card */}
            <div 
              onClick={() => { setSelectedPortal('admin'); setError(null); }}
              className="group cursor-pointer bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-purple-600 shadow-sm hover:shadow-lg transition-all text-center flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Head Admin
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Master Program Governance, Role Allocation & Excel Import
                  </p>
                </div>
              </div>
              <button className="mt-5 w-full py-2 rounded-xl text-xs font-bold bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white transition-colors flex items-center justify-center gap-1.5">
                <span>Admin Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. SEPARATE STUDENT LOGIN FORM */}
      {selectedPortal === 'student' && (
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <button
              onClick={() => setSelectedPortal(null)}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal Selector</span>
            </button>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              MBA Student
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Student Portal Login</h2>
            <p className="text-xs text-slate-500 mt-1">
              For Secretary, Executive & Member Roll Numbers (25MBA001 to 25MBA175)
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStudentLogin} className="space-y-4">
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
                <span className="text-[10px] text-slate-500">
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
              <span>{loading ? 'Verifying...' : 'Sign In as Student'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button 
              onClick={() => { setSelectedPortal('faculty'); setError(null); }}
              className="hover:text-indigo-600 font-medium"
            >
              Faculty Login &rarr;
            </button>
            <button 
              onClick={() => { setSelectedPortal('admin'); setError(null); }}
              className="hover:text-purple-600 font-medium"
            >
              Head Admin &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 2. SEPARATE FACULTY LOGIN FORM */}
      {selectedPortal === 'faculty' && (
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <button
              onClick={() => setSelectedPortal(null)}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal Selector</span>
            </button>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              MBA Faculty
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Faculty Portal Login</h2>
            <p className="text-xs text-slate-500 mt-1">
              For Faculty Coordinators & Club Mentors
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFacultyLogin} className="space-y-4">
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
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Faculty Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
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
              <span>{loading ? 'Verifying...' : 'Sign In as Faculty'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button 
              onClick={() => { setSelectedPortal('student'); setError(null); }}
              className="hover:text-indigo-600 font-medium"
            >
              &larr; Student Login
            </button>
            <button 
              onClick={() => { setSelectedPortal('admin'); setError(null); }}
              className="hover:text-purple-600 font-medium"
            >
              Head Admin &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 3. SEPARATE HEAD ADMIN LOGIN FORM */}
      {selectedPortal === 'admin' && (
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <button
              onClick={() => setSelectedPortal(null)}
              className="text-xs font-semibold text-slate-500 hover:text-purple-600 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal Selector</span>
            </button>
            <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
              Head Administration
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Head Admin Login</h2>
            <p className="text-xs text-slate-500 mt-1">
              Chief Administrator & Institutional Control
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Admin Username or Email *
              </label>
              <input
                type="text"
                required
                placeholder="admin@mba.edu or admin"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Admin Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter admin password"
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
              <span>{loading ? 'Verifying...' : 'Access Head Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button 
              onClick={() => { setSelectedPortal('student'); setError(null); }}
              className="hover:text-indigo-600 font-medium"
            >
              &larr; Student Login
            </button>
            <button 
              onClick={() => { setSelectedPortal('faculty'); setError(null); }}
              className="hover:text-blue-600 font-medium"
            >
              Faculty Login &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 space-y-0.5">
        <p>Department of Management Studies &bull; MBA Activities Management System</p>
        <p className="text-[11px] text-slate-400">
          Positions: Secretary &bull; Executive &bull; Member
        </p>
      </div>

    </div>
  );
};
