import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  Users, 
  FileText,
  Tag,
  AlertCircle,
  X
} from 'lucide-react';
import { Activity, ActivityCategory, ActivityStatus, DynamicForm } from '../types';
import { useAuth } from '../context/AuthContext';
import { createActivity, updateActivity, deleteActivity, incrementActivityRegistration } from '../services/activityService';

interface AgendaProps {
  activities: Activity[];
  forms: DynamicForm[];
  onSelectForm: (form: DynamicForm) => void;
  onOpenCreateFormForActivity: (activity: Activity) => void;
}

export const Agenda: React.FC<AgendaProps> = ({
  activities,
  forms,
  onSelectForm,
  onOpenCreateFormForActivity,
}) => {
  const { userProfile, role, isFaculty, isAdmin } = useAuth();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<Activity | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('workshop');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formEndTime, setFormEndTime] = useState('12:00');
  const [formVenue, setFormVenue] = useState('');
  const [formSpeaker, setFormSpeaker] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState<number>(100);
  const [formMaterialsUrl, setFormMaterialsUrl] = useState('');
  const [formStatus, setFormStatus] = useState<ActivityStatus>('upcoming');
  const [saving, setSaving] = useState(false);

  // RSVP success message toast
  const [rsvpToast, setRsvpToast] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Activities' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'seminar', label: 'Seminars' },
    { id: 'guest_lecture', label: 'Guest Lectures' },
    { id: 'competition', label: 'Competitions' },
    { id: 'club_event', label: 'Club Events' },
    { id: 'placement', label: 'Placement Talks' },
    { id: 'industrial_visit', label: 'Industrial Visits' },
  ];

  const filteredActivities = activities.filter((act) => {
    const matchesSearch = 
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.speaker && act.speaker.toLowerCase().includes(searchQuery.toLowerCase())) ||
      act.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || act.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || act.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormCategory('workshop');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStartTime('10:00');
    setFormEndTime('12:00');
    setFormVenue('Main MBA Hall');
    setFormSpeaker('');
    setFormMaxParticipants(100);
    setFormMaterialsUrl('');
    setFormStatus('upcoming');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (act: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormCategory(act.category);
    setFormDescription(act.description);
    setFormDate(act.date);
    setFormStartTime(act.startTime);
    setFormEndTime(act.endTime);
    setFormVenue(act.venue);
    setFormSpeaker(act.speaker || '');
    setFormMaxParticipants(act.maxParticipants || 100);
    setFormMaterialsUrl(act.materialsUrl || '');
    setFormStatus(act.status);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (act: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${act.title}"?`)) {
      try {
        await deleteActivity(act.id);
      } catch (err) {
        alert('Failed to delete activity: ' + err);
      }
    }
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate || !formVenue) {
      alert('Please fill in title, date, and venue.');
      return;
    }

    setSaving(true);
    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, {
          title: formTitle,
          category: formCategory,
          description: formDescription,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          venue: formVenue,
          speaker: formSpeaker || undefined,
          maxParticipants: Number(formMaxParticipants) || undefined,
          materialsUrl: formMaterialsUrl || undefined,
          status: formStatus,
        });
      } else {
        await createActivity({
          title: formTitle,
          category: formCategory,
          description: formDescription,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          venue: formVenue,
          speaker: formSpeaker || undefined,
          organizerId: userProfile?.uid || 'faculty-01',
          organizerName: userProfile?.displayName || 'MBA Faculty',
          maxParticipants: Number(formMaxParticipants) || 100,
          materialsUrl: formMaterialsUrl || undefined,
          status: formStatus,
        });
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      alert('Error saving activity: ' + err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickRegister = async (act: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If a linked form exists, redirect to it
    const linkedForm = forms.find(f => f.activityId === act.id || f.id === act.linkedFormId);
    if (linkedForm) {
      onSelectForm(linkedForm);
      return;
    }

    // Direct registration
    try {
      await incrementActivityRegistration(act.id);
      setRsvpToast(`Successfully registered for "${act.title}"!`);
      setTimeout(() => setRsvpToast(null), 4000);
    } catch (err) {
      alert('Failed to register: ' + err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {rsvpToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl animate-bounce">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{rsvpToast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>MBA Activity & Event Agenda</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse schedule, workshops, industry sessions, and register in Firestore.
          </p>
        </div>

        {isFaculty && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add MBA Activity</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search activity title, speaker, venue or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredActivities.map((act) => {
          const linkedForm = forms.find(f => f.activityId === act.id || f.id === act.linkedFormId);
          const maxPart = act.maxParticipants || 100;
          const regCount = act.registeredCount || 0;
          const percentFull = Math.min(100, Math.round((regCount / maxPart) * 100));

          return (
            <div
              key={act.id}
              onClick={() => setSelectedActivityDetail(act)}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-lg transition-all hover:border-indigo-400 dark:hover:border-indigo-500 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row: category, status, and action buttons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {act.category.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      act.status === 'upcoming' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : act.status === 'ongoing'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {act.status}
                    </span>
                  </div>

                  {isFaculty && (
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEdit(act, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Edit Activity"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(act, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {act.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {act.description}
                </p>

                {/* Metadata List */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{act.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{act.startTime} - {act.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{act.venue}</span>
                  </div>
                  {act.speaker && (
                    <div className="flex items-center gap-1.5 truncate col-span-2 text-indigo-700 dark:text-indigo-300 font-medium">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{act.speaker}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Capacity bar & Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Capacity / Registrations</span>
                    <span>{regCount} / {maxPart} ({percentFull}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        percentFull >= 90 ? 'bg-indigo-700' : percentFull >= 60 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percentFull}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {linkedForm ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForm(linkedForm);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Registration Form ({linkedForm.submissionCount || 0})</span>
                    </button>
                  ) : isFaculty ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCreateFormForActivity(act);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach Form</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Open Attendance</span>
                  )}

                  <button
                    onClick={(e) => handleQuickRegister(act, e)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                  >
                    <span>RSVP Now</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching MBA activities found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Activity Details Drawer */}
      {selectedActivityDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {selectedActivityDetail.category.replace('_', ' ')}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                  {selectedActivityDetail.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedActivityDetail.description}
            </p>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">Date:</span> {selectedActivityDetail.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">Time:</span> {selectedActivityDetail.startTime} - {selectedActivityDetail.endTime}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">Venue:</span> {selectedActivityDetail.venue}
              </div>
              {selectedActivityDetail.speaker && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold">Speaker / Host:</span> {selectedActivityDetail.speaker}
                </div>
              )}
              {selectedActivityDetail.materialsUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <ExternalLink className="w-4 h-4 text-indigo-500" />
                  <a
                    href={selectedActivityDetail.materialsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Download Study Materials & Slides
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Close
              </button>
              <button
                onClick={(e) => {
                  handleQuickRegister(selectedActivityDetail, e);
                  setSelectedActivityDetail(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                Confirm RSVP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Activity */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingActivity ? 'Edit MBA Activity' : 'Publish New MBA Activity'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. McKinsey Case Competition 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="guest_lecture">Guest Lecture</option>
                    <option value="competition">Competition</option>
                    <option value="club_event">Club Event</option>
                    <option value="placement">Placement Talk</option>
                    <option value="industrial_visit">Industrial Visit</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the session agenda, takeaways, prerequisites..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium Hall B"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Speaker / Faculty
                  </label>
                  <input
                    type="text"
                    placeholder="Guest name or designation"
                    value={formSpeaker}
                    onChange={(e) => setFormSpeaker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxParticipants}
                    onChange={(e) => setFormMaxParticipants(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Materials Link (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formMaterialsUrl}
                    onChange={(e) => setFormMaterialsUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
