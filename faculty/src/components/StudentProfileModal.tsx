import React, { useState } from 'react';
import { X, User, Lock, Check, AlertCircle } from 'lucide-react';
import { ClubCategory, UserProfile } from '../types';
import { updateSystemUser } from '../services/userService';
import { celebrate } from '../lib/celebrate';

interface StudentProfileModalProps {
  student: UserProfile;       // live copy, so changes made elsewhere show up
  clubs: ClubCategory[];
  onClose: () => void;
}

const YEAR_OPTIONS = (() => {
  const y = new Date().getFullYear();
  const out: string[] = [];
  for (let start = y - 1; start <= y + 1; start++) {
    out.push(`1st Year (${start}-${start + 2})`, `2nd Year (${start - 1}-${start + 1})`);
  }
  return Array.from(new Set(out));
})();

// Full student profile (as filled by the student on first login) with faculty-editable fields.
export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, clubs, onClose }) => {
  const [name, setName] = useState(student.displayName || '');
  const [department, setDepartment] = useState(student.department && student.department !== 'MBA General' ? student.department : '');
  const [year, setYear] = useState(student.yearOfStudying || '');
  const [position, setPosition] = useState(student.position || 'Member');
  const [club, setClub] = useState(student.club || clubs[0]?.name || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateSystemUser(student.uid, {
        displayName: name.trim() || student.displayName,
        ...(department.trim() ? { department: department.trim() } : {}),
        yearOfStudying: year.trim(),
        position,
        club: position === 'Member' ? '' : (club || clubs[0]?.name || ''),
      });
      setDone(true);
      celebrate();
      setTimeout(() => setDone(false), 2500);
    } catch (err: any) {
      setError(err?.message || 'Could not update the profile.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900';
  const ro = 'w-full px-3 py-2 rounded-xl text-xs bg-slate-100 border border-slate-200 text-slate-600 font-semibold truncate';
  const collegeMail = student.email && !student.email.endsWith('@mba.edu') ? student.email : 'Not entered yet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4 page-anim">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Profile</h3>
              <p className="text-xs text-slate-500 font-mono">{student.rollNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* Filled by the student */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><Lock className="w-3 h-3" />Roll Number</label>
            <div className={`${ro} font-mono`}>{student.rollNumber}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><Lock className="w-3 h-3" />User ID</label>
            <div className={`${ro} font-mono`}>{student.uid}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">College Mail ID</label>
            <div className={ro}>{collegeMail}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Gender</label>
            <div className={ro}>{student.gender || 'Not set yet'}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Batch</label>
            <div className={ro}>{student.batch || '-'}</div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Profile Status</label>
            <div className={ro}>{student.profileCompleted ? 'Completed by student' : 'Not completed yet'}</div>
          </div>
        </div>

        {/* Editable by faculty */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-[11px] font-bold text-slate-700">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={input} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Finance" className={input} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Year of Studying</label>
              <input type="text" list="year-options" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2nd Year (2025-2027)" className={input} />
              <datalist id="year-options">
                {YEAR_OPTIONS.map((y) => <option key={y} value={y} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Position</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className={`${input} font-bold`}>
                <option value="Secretary">Secretary</option>
                <option value="Executive">Executive</option>
                <option value="Member">Member</option>
              </select>
            </div>
            {position !== 'Member' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Club</label>
                <select value={club} onChange={(e) => setClub(e.target.value)} className={input}>
                  {clubs.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Close</button>
            <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 inline-flex items-center gap-1">
              {saving ? 'Submitting...' : done ? (<><Check className="w-3.5 h-3.5" /><span>Submitted</span></>) : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
