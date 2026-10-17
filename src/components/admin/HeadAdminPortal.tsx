import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  FileSpreadsheet, 
  Upload, 
  UserPlus, 
  Users, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Search, 
  Trash2, 
  Plus, 
  Sparkles, 
  Settings,
  FolderPlus,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Activity, ClubCategory, ClubEventAgenda, DynamicForm, FeatureAccessControls, UserProfile, UserRole } from '../../types';
import { updateFeatureControls } from '../../services/settingsService';
import { 
  createSystemUser, 
  updateSystemUser, 
  deleteSystemUser, 
  generateStudentCohort, 
  importUsersFromExcelRows 
} from '../../services/userService';
import { addCustomClub } from '../../services/clubEventService';
import { ClubEventsSection } from '../events/ClubEventsSection';

interface HeadAdminPortalProps {
  featureControls: FeatureAccessControls;
  users: UserProfile[];
  activities: Activity[];
  forms: DynamicForm[];
  clubEvents: ClubEventAgenda[];
  clubs: ClubCategory[];
  onOpenCreateClubEvent: () => void;
  onOpenCreateActivity: () => void;
  onOpenCreateForm: () => void;
  onSelectForm: (form: DynamicForm) => void;
}

export const HeadAdminPortal: React.FC<HeadAdminPortalProps> = ({
  featureControls,
  users,
  activities,
  forms,
  clubEvents,
  clubs,
  onOpenCreateClubEvent,
  onOpenCreateActivity,
  onOpenCreateForm,
  onSelectForm,
}) => {
  const [adminTab, setAdminTab] = useState<'club_events' | 'access_control' | 'excel_import' | 'users' | 'clubs_mgmt' | 'activities' | 'forms'>('club_events');

  // Excel Import state
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{ added: number; errors: string[] } | null>(null);

  // Cohort generation state
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortSuccess, setCohortSuccess] = useState<string | null>(null);

  // User management state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Custom Club state
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [addingClub, setAddingClub] = useState(false);

  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [newUserRoll, setNewUserRoll] = useState('');
  const [newUserPosition, setNewUserPosition] = useState<'Secretary' | 'Executive' | 'Member'>('Member');
  const [newUserClub, setNewUserClub] = useState('NISM');
  const [newUserYear, setNewUserYear] = useState('1st Year (2025-2027)');
  const [newUserDept, setNewUserDept] = useState('MBA General');
  const [savingUser, setSavingUser] = useState(false);

  const handleToggle = async (key: keyof FeatureAccessControls) => {
    const currentVal = !!featureControls[key];
    try {
      await updateFeatureControls({ [key]: !currentVal }, 'Head Admin');
    } catch (err) {
      alert('Failed to update feature access: ' + err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('Excel file is empty.');
          setImportLoading(false);
          return;
        }

        const res = await importUsersFromExcelRows(data);
        setImportSummary(res);
      } catch (err: any) {
        alert('Error parsing Excel file: ' + err.message);
      } finally {
        setImportLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'Name Of student': 'Aarav Sharma',
        'Roll Number': '25MBA001',
        'Year of studing': '1st Year (2025-2027)',
        'position': 'Secretary'
      },
      {
        'Name Of student': 'Aditi Verma',
        'Roll Number': '25MBA002',
        'Year of studing': '1st Year (2025-2027)',
        'position': 'Executive'
      },
      {
        'Name Of student': 'Akash Patel',
        'Roll Number': '25MBA005',
        'Year of studing': '1st Year (2025-2027)',
        'position': 'Member'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
    XLSX.writeFile(wb, 'MBA_Student_Roster_Template.xlsx');
  };

  const handleGenerateCohort = async () => {
    if (!confirm('Auto-generate student batch 25MBA001 to 25MBA175 with default Secretary, Executive, and Member positions?')) {
      return;
    }

    setCohortLoading(true);
    setCohortSuccess(null);
    try {
      const count = await generateStudentCohort('25MBA', 1, 175, '1st Year (2025-2027)');
      setCohortSuccess(`Generated ${count} MBA students (25MBA001 to 25MBA175) with Secretary, Executive, and Member positions!`);
    } catch (err: any) {
      alert('Error generating batch: ' + err.message);
    } finally {
      setCohortLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName) return;

    setSavingUser(true);
    try {
      const cleanRoll = newUserRoll.trim().toUpperCase();
      const uid = cleanRoll ? `student_${cleanRoll.toLowerCase()}` : `usr_${Date.now()}`;
      await createSystemUser({
        uid,
        displayName: newUserName,
        email: newUserEmail || `${cleanRoll ? cleanRoll.toLowerCase() : 'user'}@mba.edu`,
        role: newUserRole,
        rollNumber: cleanRoll || undefined,
        passwordHash: cleanRoll || '123456',
        position: newUserPosition,
        club: newUserClub,
        yearOfStudying: newUserYear,
        department: newUserDept,
        status: 'active',
      });
      setIsAddUserModalOpen(false);
      setNewUserName('');
      setNewUserRoll('');
    } catch (err: any) {
      alert('Failed to save user: ' + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  // Change student position: Secretary, Executive, or Member
  const handleUpdateStudentPosition = async (u: UserProfile, newPos: string) => {
    try {
      await updateSystemUser(u.uid, { position: newPos });
    } catch (err: any) {
      alert('Failed to update position: ' + err.message);
    }
  };

  // Add custom club
  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    setAddingClub(true);
    try {
      await addCustomClub(newClubName, newClubDesc, 'Head Admin');
      setNewClubName('');
      setNewClubDesc('');
      alert('New club / category added successfully!');
    } catch (err: any) {
      alert('Failed to add club: ' + err.message);
    } finally {
      setAddingClub(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch = 
      u.displayName.toLowerCase().includes(q) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q));

    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner (Clean Light-Themed Gradient) */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Head Administrator Command Center</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              MBA Program Governance & Access Control
            </h1>
            <p className="text-xs text-purple-100 mt-1">
              Full control over Club Event Agendas, Secretary Approvals, Role Assignment, and On/Off Controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateCohort}
              disabled={cohortLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-indigo-900 shadow-sm disabled:opacity-50 transition-all hover:bg-slate-100"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{cohortLoading ? 'Generating...' : 'Auto-Generate Cohort 25MBA001-175'}</span>
            </button>
          </div>
        </div>
      </div>

      {cohortSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{cohortSuccess}</span>
          </div>
          <button
            onClick={() => setCohortSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setAdminTab('club_events')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'club_events'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Club Event Agendas & Files ({clubEvents.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('access_control')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'access_control'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Feature Access Controls (On/Off)</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'users'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Assign Positions (Secretary/Executive/Member)</span>
        </button>

        <button
          onClick={() => setAdminTab('clubs_mgmt')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'clubs_mgmt'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Clubs & Categories ({clubs.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('excel_import')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'excel_import'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Import Excel Roster</span>
        </button>
      </div>

      {/* 1. CLUB EVENTS & SECRETARY OVERSIGHT */}
      {adminTab === 'club_events' && (
        <ClubEventsSection
          events={clubEvents}
          clubs={clubs}
          onOpenCreateModal={onOpenCreateClubEvent}
          canCreateEvent={true}
        />
      )}

      {/* 2. FEATURE ACCESS CONTROLS (ON/OFF) */}
      {adminTab === 'access_control' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>Granular Role & Position Access Controls</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Toggle features On or Off in real-time. Changes take effect across all user sessions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Student Event RSVP & Registration</h4>
                  <p className="text-[11px] text-slate-500">Allows MBA students to register for events</p>
                </div>
                <button onClick={() => handleToggle('studentCanRSVP')} className={`p-1.5 ${featureControls.studentCanRSVP ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {featureControls.studentCanRSVP ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Executive / Student Event Creation</h4>
                  <p className="text-[11px] text-slate-500">Enables Executive roll members to create events</p>
                </div>
                <button onClick={() => handleToggle('studentLeadersCanCreateEvents')} className={`p-1.5 ${featureControls.studentLeadersCanCreateEvents ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {featureControls.studentLeadersCanCreateEvents ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Faculty Activity Publishing</h4>
                  <p className="text-[11px] text-slate-500">Enables faculty to publish workshops and talks</p>
                </div>
                <button onClick={() => handleToggle('facultyCanCreateActivities')} className={`p-1.5 ${featureControls.facultyCanCreateActivities ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {featureControls.facultyCanCreateActivities ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Download Presentation Files</h4>
                  <p className="text-[11px] text-slate-500">Allows downloading attached PPT, Video, and PDF</p>
                </div>
                <button onClick={() => handleToggle('studentCanViewMaterials')} className={`p-1.5 ${featureControls.studentCanViewMaterials ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {featureControls.studentCanViewMaterials ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. POSITION ASSIGNMENT (SECRETARY / EXECUTIVE / MEMBER) */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Roll Number, Name, Position..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Assigned Position (Change)</th>
                    <th className="px-4 py-3">Assigned Club</th>
                    <th className="px-4 py-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.filter(u => u.role === 'student').slice(0, 100).map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                        {u.rollNumber}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {u.displayName}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.position || 'Member'}
                          onChange={(e) => handleUpdateStudentPosition(u, e.target.value)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 bg-slate-50 text-slate-800"
                        >
                          <option value="Secretary">Secretary (Can Approve Events)</option>
                          <option value="Executive">Executive (Selects 8 Participants)</option>
                          <option value="Member">Member (Normal Member)</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.club || 'NISM'}
                          onChange={async (e) => {
                            await updateSystemUser(u.uid, { club: e.target.value });
                          }}
                          className="px-2 py-1 rounded-lg text-xs border border-slate-200 bg-white"
                        >
                          {clubs.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            if (confirm(`Remove ${u.displayName}?`)) await deleteSystemUser(u.uid);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLUBS & CATEGORIES MANAGEMENT */}
      {adminTab === 'clubs_mgmt' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              <span>MBA Department Clubs & Categories</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pre-configured: NISM, NIPM, Ad Club, Student Activity. Head Admin and Faculty can create new custom categories.
            </p>

            {/* List of Clubs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {clubs.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{c.name}</span>
                    {c.isCustom && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">Custom</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{c.description || 'Department Club'}</p>
                </div>
              ))}
            </div>

            {/* Add Custom Club Form */}
            <form onSubmit={handleAddClub} className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3 pt-4">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                + Add New Club / Category
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Club / Category Name (e.g. Analytics Club)"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Short Description"
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={addingClub}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  {addingClub ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. EXCEL IMPORT */}
      {adminTab === 'excel_import' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  <span>Import MBA Student & Faculty Roster from Excel</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Headers: Name Of student, Roll Number, Year of studing, position
                </p>
              </div>

              <button
                onClick={handleDownloadSampleExcel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Excel</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <Upload className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm">
                <span>{importLoading ? 'Reading & Uploading...' : 'Browse Excel File (.xlsx, .csv)'}</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={importLoading} className="hidden" />
              </label>
            </div>

            {importSummary && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-600" />
                Import completed: {importSummary.added} students added to Firestore!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Student / Member</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kavita Deshmukh"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number (25MBA001 to 25MBA175)</label>
                <input
                  type="text"
                  placeholder="25MBA..."
                  value={newUserRoll}
                  onChange={(e) => setNewUserRoll(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 border border-slate-300 text-slate-900 uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                  <select
                    value={newUserPosition}
                    onChange={(e) => setNewUserPosition(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900 font-bold"
                  >
                    <option value="Secretary">Secretary</option>
                    <option value="Executive">Executive</option>
                    <option value="Member">Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Club</label>
                  <select
                    value={newUserClub}
                    onChange={(e) => setNewUserClub(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={savingUser} className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">{savingUser ? 'Saving...' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
