import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Building, 
  ShieldCheck, 
  Globe, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { StudentLogin } from './student/StudentLogin';
import { FacultyLogin } from './faculty/FacultyLogin';
import { AdminLogin } from './admin/AdminLogin';

export type PortalType = 'student' | 'faculty' | 'admin';

export const LoginScreen: React.FC = () => {
  // Detect portal from URL query (?portal=student|faculty|admin) or pathname (/student, /faculty, /admin) or hash (#student, #faculty, #admin)
  const getInitialPortal = (): PortalType => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const portalParam = searchParams.get('portal');
      if (portalParam === 'faculty') return 'faculty';
      if (portalParam === 'admin') return 'admin';
      if (portalParam === 'student') return 'student';

      const path = window.location.pathname.toLowerCase();
      if (path.includes('faculty')) return 'faculty';
      if (path.includes('admin')) return 'admin';
      if (path.includes('student')) return 'student';

      const hash = window.location.hash.toLowerCase();
      if (hash.includes('faculty')) return 'faculty';
      if (hash.includes('admin')) return 'admin';
      if (hash.includes('student')) return 'student';
    }
    return 'student'; // Default direct view to MBA Student
  };

  const [activePortal, setActivePortal] = useState<PortalType>(getInitialPortal);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Sync portal when user switches
  const handleSwitchPortal = (portal: PortalType) => {
    setActivePortal(portal);
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?portal=${portal}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  const copyVercelLink = (portal: PortalType) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?portal=${portal}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(portal);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Vercel Separate Web Apps Switcher Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Separate Vercel Web App Links:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {/* Student Link Tab */}
            <button
              onClick={() => handleSwitchPortal('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                activePortal === 'student'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student App</span>
            </button>

            {/* Faculty Link Tab */}
            <button
              onClick={() => handleSwitchPortal('faculty')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                activePortal === 'faculty'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Faculty App</span>
            </button>

            {/* Admin Link Tab */}
            <button
              onClick={() => handleSwitchPortal('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                activePortal === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Head Admin App</span>
            </button>

            {/* Copy Link for current Vercel deployment */}
            <button
              onClick={() => copyVercelLink(activePortal)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 ml-1 transition-colors"
              title="Copy direct web app URL"
            >
              {copiedLink === activePortal ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Main Content: Render ONLY the Selected Portal Login Directly! */}
      <div className="flex-1 flex flex-col justify-center">
        {activePortal === 'student' && <StudentLogin />}
        {activePortal === 'faculty' && <FacultyLogin />}
        {activePortal === 'admin' && <AdminLogin />}
      </div>

    </div>
  );
};
