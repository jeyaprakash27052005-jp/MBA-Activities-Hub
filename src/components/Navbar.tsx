import React, { useState } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  FileText, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  KeyRound, 
  ShieldCheck, 
  ChevronDown,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openChangePasswordModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openChangePasswordModal,
}) => {
  const { userProfile, role, isAdmin, isFaculty, isStudent, signOut } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Dynamic Navigation items tailored to current authenticated role
  const getNavItems = () => {
    if (isAdmin) {
      return [
        { id: 'admin_portal', label: 'Admin Command', icon: ShieldCheck },
        { id: 'agenda', label: 'Activities Agenda', icon: Calendar },
        { id: 'forms', label: 'Forms & Submissions', icon: FileText },
      ];
    } else if (isFaculty) {
      return [
        { id: 'faculty_portal', label: 'Faculty Workspace', icon: LayoutDashboard },
        { id: 'agenda', label: 'Activities Agenda', icon: Calendar },
        { id: 'forms', label: 'Forms & Registrations', icon: FileText },
      ];
    } else {
      return [
        { id: 'student_portal', label: 'My Student Portal', icon: GraduationCap },
        { id: 'agenda', label: 'MBA Schedule', icon: Calendar },
        { id: 'forms', label: 'Registration Forms', icon: FileText },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentTab(isAdmin ? 'admin_portal' : isFaculty ? 'faculty_portal' : 'student_portal')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                MBA Activities Hub
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isAdmin ? 'Head Administrator Portal' : isFaculty ? 'Faculty Management Portal' : `MBA Student Portal (${userProfile?.rollNumber || 'Active'})`}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* User Profile & Sign Out Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 pl-2 pr-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs ${
                  isAdmin ? 'bg-purple-600' : isFaculty ? 'bg-blue-600' : 'bg-indigo-600'
                }`}>
                  {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight max-w-[130px] truncate">
                    {userProfile?.displayName || userProfile?.rollNumber || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {userProfile?.rollNumber || userProfile?.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {userProfile?.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {userProfile?.email}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        isFaculty ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {userProfile?.position || role}
                      </span>
                      {userProfile?.rollNumber && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {userProfile.rollNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      openChangePasswordModal();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change Password & Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-200 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
