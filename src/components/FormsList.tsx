import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  Edit3, 
  Trash2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { DynamicForm, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { deleteForm } from '../services/formService';

interface FormsListProps {
  forms: DynamicForm[];
  activities: Activity[];
  onSelectForm: (form: DynamicForm) => void;
  onOpenCreate: () => void;
  onEditForm: (form: DynamicForm) => void;
}

export const FormsList: React.FC<FormsListProps> = ({
  forms,
  activities,
  onSelectForm,
  onOpenCreate,
  onEditForm,
}) => {
  const { isFaculty, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'drafts'>('all');

  const filteredForms = forms.filter((f) => {
    const matchesSearch = 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.activityTitle && f.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPublished = 
      filterPublished === 'all' ||
      (filterPublished === 'published' && f.isPublished) ||
      (filterPublished === 'drafts' && !f.isPublished);

    return matchesSearch && matchesPublished;
  });

  const handleDelete = async (form: DynamicForm, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${form.title}"?`)) {
      try {
        await deleteForm(form.id);
      } catch (err) {
        alert('Failed to delete form: ' + err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Activity Forms & Registrations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build dynamic questionnaires, collect responses in real-time, and export participant rosters.
          </p>
        </div>

        {isFaculty && (
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Form</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search forms by title, description or linked activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value as any)}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Forms ({forms.length})</option>
          <option value="published">Published Only</option>
          <option value="drafts">Drafts Only</option>
        </select>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredForms.map((form) => (
          <div
            key={form.id}
            onClick={() => onSelectForm(form)}
            className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-lg transition-all hover:border-indigo-400 dark:hover:border-indigo-500 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header tags */}
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  form.isPublished
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}>
                  {form.isPublished ? 'Published' : 'Draft'}
                </span>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{form.submissionCount || 0} RSVPs</span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {form.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {form.description}
              </p>

              {/* Linked Activity & Deadline */}
              <div className="space-y-1.5 pt-1 text-xs text-slate-500 dark:text-slate-400">
                {form.activityTitle && (
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-medium truncate">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{form.activityTitle}</span>
                  </div>
                )}
                {form.deadline && (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Closes: {form.deadline}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-400">
                  {form.fields.length} Custom Questions Configured
                </div>
              </div>
            </div>

            {/* Footer action bar */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>{isFaculty ? 'Manage & Review' : 'Fill Form'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>

              {isFaculty && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditForm(form)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Edit Form"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDelete(form, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredForms.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching forms found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create a new form or populate sample data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
