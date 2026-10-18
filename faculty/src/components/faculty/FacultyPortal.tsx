import React, { useState } from 'react';
import { celebrate } from '../../lib/celebrate';
import { 
  Building, 
  Calendar, 
  FileText, 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  ShieldAlert,
  Download,
  AlertCircle,
  Tag,
  Search,
  Check
} from 'lucide-react';
import { Activity, ClubCategory, ClubEventAgenda, DynamicForm, FeatureAccessControls, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { updateSystemUser } from '../../services/userService';
import { addCustomClub } from '../../services/clubEventService';
import { NextBatchForm } from '../NextBatchForm';
import { StudentProfileModal } from '../StudentProfileModal';
import { ClubEventsSection } from '../events/ClubEventsSection';

interface FacultyPortalProps {
  activities: Activity[];
  forms: DynamicForm[];
  clubEvents: ClubEventAgenda[];
  clubs: ClubCategory[];
  allStudents: UserProfile[];
  featureControls: FeatureAccessControls;
  onOpenCreateClubEvent: () => void;
  onOpenCreateActivity: () => void;
  onOpenCreateForm: () => void;
  onSelectForm: (form: DynamicForm) => void;
  onSelectActivity: (activity: Activity) => void;
}

export const FacultyPortal: React.FC<FacultyPortalProps> = ({
  activities,
  forms,
  clubEvents,
  clubs,
  allStudents,
  featureControls,
  onOpenCreateClubEvent,
  onOpenCreateActivity,
  onOpenCreateForm,
  onSelectForm,
  onSelectActivity,
}) => {
  const { userProfile } = useAuth();
  const [facultySubTab, setFacultySubTab] = useState<'club_events' | 'positions' | 'next_batch' | 'clubs_mgmt' | 'activities' | 'forms'>('club_events');

  const [studentSearch, setStudentSearch] = useState('');
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const profileStudent = profileUid ? allStudents.find((x) => x.uid === profileUid) : undefined;
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [addingClub, setAddingClub] = useState(false);

  // Explicit submit button state for position allocation
  const [editingPositions, setEditingPositions] = useState<Record<string, { position: string; club: string; department?: string; displayName?: string }>>({});
  const [submittingPositionUid, setSubmittingPositionUid] = useState<string | null>(null);
  const [savedPositionSuccessUid, setSavedPositionSuccessUid] = useState<string | null>(null);

  const handleSubmitPosition = async (st: UserProfile) => {
    const chosen = editingPositions[st.uid] || { 
      position: st.position || 'Member', 
      club: st.club || 'NISM' 
    };
    const department = (chosen.department ?? st.department ?? '').trim();
    const displayName = (chosen.displayName ?? st.displayName ?? '').trim();
    setSubmittingPositionUid(st.uid);
    try {
      await updateSystemUser(st.uid, {
        position: chosen.position,
        club: chosen.position === 'Member' ? '' : (chosen.club || clubs[0]?.name || 'NISM'),
        ...(department ? { department } : {}),
        ...(displayName ? { displayName } : {}),
      });
      setSavedPositionSuccessUid(st.uid);
      celebrate();
      setTimeout(() => setSavedPositionSuccessUid(null), 2500);
    } catch (err: any) {
      alert('Failed to update position: ' + err.message);
    } finally {
      setSubmittingPositionUid(null);
    }
  };

  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    setAddingClub(true);
    try {
      await addCustomClub(newClubName, newClubDesc, userProfile?.displayName || 'Faculty');
      setNewClubName('');
      setNewClubDesc('');
      celebrate();
      alert('New club category created!');
    } catch (err: any) {
      alert('Failed to add category: ' + err.message);
    } finally {
      setAddingClub(false);
    }
  };

  const filteredStudents = allStudents.filter(st => {
    const q = studentSearch.toLowerCase();
    return (
      st.displayName.toLowerCase().includes(q) ||
      (st.rollNumber && st.rollNumber.toLowerCase().includes(q)) ||
      (st.position && st.position.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Faculty Profile Banner (Light Theme) */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-bold bg-white/20 text-white mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>MBA Faculty Advisor Workspace</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {userProfile?.displayName || 'Faculty Coordinator'}
            </h1>
            <p className="text-xs text-blue-100 mt-1 flex items-center gap-2">
              <span>Faculty ID: <strong>{userProfile?.facultyId || 'FAC001'}</strong></span>
              <span>&bull;</span>
              <span>Position: <strong>{userProfile?.position || 'Faculty Advisor'}</strong></span>
              <span>&bull;</span>
              <span>Department: <strong>{userProfile?.department || 'Management Studies'}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCreateClubEvent}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-blue-900 shadow-sm hover:bg-slate-100 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Create Event Agenda (8 Participants)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFacultySubTab('club_events')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            facultySubTab === 'club_events'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Club Agendas & Approvals ({clubEvents.length})</span>
        </button>

        <button
          onClick={() => setFacultySubTab('positions')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            facultySubTab === 'positions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Assign Roll Positions (Secretary/Executive/Member)</span>
        </button>

        <button
          onClick={() => setFacultySubTab('next_batch')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            facultySubTab === 'next_batch'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Add Next Batch IDs</span>
        </button>

        <button
          onClick={() => setFacultySubTab('clubs_mgmt')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            facultySubTab === 'clubs_mgmt'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Add Custom Category / Club</span>
        </button>
      </div>

      {/* 1. CLUB EVENTS & AGENDAS */}
      <div key={facultySubTab} className="page-anim space-y-6">
      {facultySubTab === 'club_events' && (
        <ClubEventsSection
          events={clubEvents}
          clubs={clubs}
          onOpenCreateModal={onOpenCreateClubEvent}
          canCreateEvent={true}
          allStudents={allStudents}
        />
      )}

      {/* 2. POSITION ALLOCATION BY FACULTY */}
      {facultySubTab === 'positions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Roll Number or Name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <span className="text-xs text-slate-500">
              Assigned by Faculty & Head Admin
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Roll No.</th>
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Position / Club</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5 text-right sticky right-0 bg-slate-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.slice(0, 100).map((st) => {
                  const defaultClub = st.club || clubs[0]?.name || 'NISM';
                  const currentPos = editingPositions[st.uid]?.position ?? (st.position || 'Member');
                  const currentClub = editingPositions[st.uid]?.club ?? defaultClub;
                  const isSaving = submittingPositionUid === st.uid;
                  const isSaved = savedPositionSuccessUid === st.uid;

                  const patchEdit = (patch: Partial<{ position: string; club: string; department: string; displayName: string }>) =>
                    setEditingPositions(prev => ({
                      ...prev,
                      [st.uid]: {
                        position: prev[st.uid]?.position ?? (st.position || 'Member'),
                        club: prev[st.uid]?.club ?? defaultClub,
                        department: prev[st.uid]?.department,
                        displayName: prev[st.uid]?.displayName,
                        ...patch,
                      }
                    }));

                  return (
                    <tr key={st.uid} className="hover:bg-slate-50 align-top">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">{st.rollNumber}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={editingPositions[st.uid]?.displayName ?? st.displayName}
                          onChange={(e) => patchEdit({ displayName: e.target.value })}
                          className="w-36 px-2 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-900"
                        />
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{st.gender || 'Gender not set'}</span>
                          <button type="button" onClick={() => setProfileUid(st.uid)} className="text-blue-600 hover:underline font-bold">View profile</button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 space-y-1">
                        <select
                          value={currentPos}
                          onChange={(e) => patchEdit({ position: e.target.value })}
                          className="w-40 px-2 py-1 rounded-lg text-xs font-bold border border-slate-300 bg-slate-50 text-slate-800"
                        >
                          <option value="Secretary">Secretary</option>
                          <option value="Executive">Executive</option>
                          <option value="Member">Member</option>
                        </select>
                        {currentPos !== 'Member' && (
                          <select
                            value={currentClub}
                            onChange={(e) => patchEdit({ club: e.target.value })}
                            className="w-40 px-2 py-1 rounded-lg text-xs border border-slate-200 bg-white block"
                          >
                            {clubs.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          placeholder="e.g. Finance"
                          value={editingPositions[st.uid]?.department ?? (st.department && st.department !== 'MBA General' ? st.department : '')}
                          onChange={(e) => patchEdit({ department: e.target.value })}
                          className="w-28 px-2 py-1 rounded-lg text-xs border border-slate-200 bg-white"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.18)]">
                        <button
                          type="button"
                          onClick={() => handleSubmitPosition(st)}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-2xs inline-flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          {isSaving ? (
                            <span>Submitting...</span>
                          ) : isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Submitted</span>
                            </>
                          ) : (
                            <span>Submit</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CLUBS & CATEGORIES MANAGEMENT */}
      {/* NEXT BATCH STUDENT IDS */}
      {facultySubTab === 'next_batch' && <NextBatchForm />}

      {facultySubTab === 'clubs_mgmt' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Club Category (Faculty & Head Admin Option)</h3>
            <p className="text-xs text-slate-500">
              Active clubs: NISM, NIPM, Ad Club, Student Activity, and custom categories.
            </p>

            <form onSubmit={handleAddClub} className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Club Name (e.g. Entrepreneurship Club)"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={addingClub}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  {addingClub ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>

      {profileStudent && (
        <StudentProfileModal student={profileStudent} clubs={clubs} onClose={() => setProfileUid(null)} />
      )}
    </div>
  );
};
