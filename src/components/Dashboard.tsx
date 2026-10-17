import React from 'react';
import { 
  Calendar, 
  FileText, 
  Users, 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  User, 
  Layers, 
  TrendingUp, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Activity, DynamicForm, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  activities: Activity[];
  forms: DynamicForm[];
  users: UserProfile[];
  onNavigate: (tab: string) => void;
  onOpenCreateActivity: () => void;
  onOpenCreateForm: () => void;
  onSelectActivity: (activity: Activity) => void;
  onSelectForm: (form: DynamicForm) => void;
  onSeedData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activities,
  forms,
  users,
  onNavigate,
  onOpenCreateActivity,
  onOpenCreateForm,
  onSelectActivity,
  onSelectForm,
  onSeedData
}) => {
  const { role, isFaculty, isAdmin } = useAuth();

  const totalActivities = activities.length;
  const upcomingActivities = activities.filter(a => a.status === 'upcoming');
  const activeForms = forms.filter(f => f.isPublished);
  const totalSubmissions = forms.reduce((acc, f) => acc + (f.submissionCount || 0), 0);
  const studentCount = users.filter(u => u.role === 'student').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome & Migration Notice */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-4 backdrop-blur-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Modernized Architecture: Online Firestore + Vercel Deployment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            MBA Department Activity & Event Hub
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Successfully migrated from local SQL/Java database to Firebase Cloud Firestore with zero server maintenance. Manage MBA seminars, case competitions, dynamic RSVP forms, and student registrations in real-time.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {isFaculty && (
              <button
                onClick={onOpenCreateActivity}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish New Activity</span>
              </button>
            )}

            {isFaculty && (
              <button
                onClick={onOpenCreateForm}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-all hover:scale-[1.02]"
              >
                <FileText className="w-4 h-4" />
                <span>Build Registration Form</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('agenda')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all"
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Explore Agenda</span>
            </button>

            <button
              onClick={() => onNavigate('vercel')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all"
            >
              <span>Vercel Deploy Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty Database State Helper */}
      {totalActivities === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 p-6 text-center">
          <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Firebase Database is Initialized
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Your Firestore collections are ready. Click below to populate realistic MBA sample activities (Case Competitions, Strategy Masterclasses, Corporate Connect) and registration forms.
          </p>
          <button
            onClick={onSeedData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample MBA Activities & Forms</span>
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Activities */}
        <div 
          onClick={() => onNavigate('agenda')}
          className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800/90 p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Activities
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalActivities}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {upcomingActivities.length} upcoming
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Workshops, Talks & Meets</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
          </p>
        </div>

        {/* Active Forms */}
        <div 
          onClick={() => onNavigate('forms')}
          className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800/90 p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Forms
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeForms.length}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              of {forms.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Registrations & Surveys</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
          </p>
        </div>

        {/* Total Submissions */}
        <div 
          onClick={() => onNavigate('forms')}
          className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800/90 p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Form Submissions
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalSubmissions}
            </span>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              Live in Firestore
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Participant records</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
          </p>
        </div>

        {/* Directory Members */}
        <div 
          onClick={() => onNavigate('users')}
          className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800/90 p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              MBA Community
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {users.length}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Faculty & Students
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Role-Based Access (RBAC)</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
          </p>
        </div>
      </div>

      {/* Main Split: Upcoming Agenda & Open Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Upcoming MBA Agenda */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Upcoming MBA Activities
              </h2>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingActivities.slice(0, 4).map((activity) => (
              <div
                key={activity.id}
                onClick={() => onSelectActivity(activity)}
                className="group cursor-pointer rounded-xl bg-white dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-xs hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {activity.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {activity.date} &bull; {activity.startTime} - {activity.endTime}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {activity.description}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="max-w-[130px] truncate">{activity.venue}</span>
                      </span>
                      {activity.speaker && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[130px] truncate">
                          {activity.speaker}
                        </p>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Details & RSVP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {upcomingActivities.length === 0 && (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No upcoming activities scheduled</p>
                <p className="text-xs mt-1">Create an activity or seed sample events to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Forms & Quick Links */}
        <div className="space-y-6">
          {/* Active Registration Forms */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Forms
                </h3>
              </div>
              <button
                onClick={() => onNavigate('forms')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                All Forms
              </button>
            </div>

            <div className="space-y-3">
              {activeForms.slice(0, 3).map((form) => (
                <div
                  key={form.id}
                  onClick={() => onSelectForm(form)}
                  className="cursor-pointer p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {form.title}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {form.submissionCount || 0} RSVPs
                    </span>
                  </div>
                  {form.activityTitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      Linked: {form.activityTitle}
                    </p>
                  )}
                  {form.deadline && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                      Deadline: {form.deadline}
                    </p>
                  )}
                </div>
              ))}

              {activeForms.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                  No active registration forms yet.
                </p>
              )}
            </div>

            {isFaculty && (
              <button
                onClick={onOpenCreateForm}
                className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create New Form</span>
              </button>
            )}
          </div>

          {/* Vercel Hosting Highlights Box */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-indigo-950/40 p-5 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs">
                ▲
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Vercel Host Ready
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Configured with <code className="px-1 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">vercel.json</code> rewrites and client-side Firestore. No backend server or SQL connection pools required!
            </p>
            <button
              onClick={() => onNavigate('vercel')}
              className="mt-3 w-full py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Deployment Code & Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
