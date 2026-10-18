import React, { useState } from 'react';
import { UserCircle, Lock, AlertCircle } from 'lucide-react';
import { celebrate } from '../../lib/celebrate';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';

interface ProfileSetupProps {
  profile: UserProfile; // live copy so a department set by faculty shows up immediately
}

// Shown once, right after a student's first login.
export const ProfileSetup: React.FC<ProfileSetupProps> = ({ profile }) => {
  const { updateUserProfile, signOut } = useAuth();
  const [name, setName] = useState(profile.displayName?.startsWith('MBA Student ') ? '' : (profile.displayName || ''));
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>(profile.gender || '');
  const [collegeEmail, setCollegeEmail] = useState(profile.email && !profile.email.endsWith('@mba.edu') ? profile.email : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collegeEmail.trim())) {
      setError('Please enter a valid college mail ID.');
      return;
    }
    if (!gender) {
      setError('Please select your gender.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({ displayName: name.trim(), email: collegeEmail.trim().toLowerCase(), gender, profileCompleted: true });
      celebrate();
    } catch (err: any) {
      setError(err?.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const readOnly = 'w-full px-4 py-2.5 rounded-xl text-sm bg-slate-100 border border-slate-200 text-slate-600 font-semibold';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center mx-auto shadow-md">
            <UserCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900 pt-2">Update your profile</h1>
          <p className="text-xs text-slate-500">Complete this once to continue to your student portal.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">College Mail ID *</label>
            <input
              type="email"
              required
              placeholder="yourname@college.edu"
              value={collegeEmail}
              onChange={(e) => setCollegeEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>Department</span>
              <span className="font-normal text-slate-400">(set by faculty)</span>
            </label>
            <div className={readOnly}>{profile.department && profile.department !== 'MBA General' ? profile.department : 'Not assigned yet'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Lock className="w-3 h-3" />Roll Number</label>
              <div className={`${readOnly} font-mono`}>{profile.rollNumber}</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Lock className="w-3 h-3" />User ID</label>
              <div className={`${readOnly} font-mono truncate`}>{profile.uid}</div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Gender *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    gender === g
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit'}
          </button>
          <button type="button" onClick={signOut} className="w-full text-xs text-slate-500 hover:text-slate-800">Sign out</button>
        </form>
      </div>
    </div>
  );
};
