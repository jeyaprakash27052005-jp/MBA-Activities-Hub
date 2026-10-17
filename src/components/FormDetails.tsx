import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Send, 
  CheckCircle2, 
  Download, 
  Share2, 
  Users, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Filter, 
  Edit3, 
  Trash2,
  Copy,
  Star
} from 'lucide-react';
import { DynamicForm, FormSubmission, SubmissionStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  submitForm, 
  subscribeToSubmissions, 
  updateSubmissionStatus, 
  deleteForm 
} from '../services/formService';

interface FormDetailsProps {
  form: DynamicForm;
  onBack: () => void;
  onEdit: (form: DynamicForm) => void;
}

export const FormDetails: React.FC<FormDetailsProps> = ({ form, onBack, onEdit }) => {
  const { userProfile, role, isFaculty, isAdmin } = useAuth();
  
  // Views: 'fill' (student form submit) vs 'responses' (faculty/admin table)
  const [activeView, setActiveView] = useState<'fill' | 'responses'>(isFaculty ? 'responses' : 'fill');
  
  // Form submission state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  
  // Submissions data
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to live submissions for this form
  useEffect(() => {
    const unsubscribe = subscribeToSubmissions(
      form.id,
      (data) => {
        setSubmissions(data);
        setSubmissionsLoading(false);
      },
      (err) => {
        console.error('Submissions error:', err);
        setSubmissionsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [form.id]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    const current = (answers[fieldId] as string[]) || [];
    if (current.includes(option)) {
      setAnswers(prev => ({ ...prev, [fieldId]: current.filter(o => o !== option) }));
    } else {
      setAnswers(prev => ({ ...prev, [fieldId]: [...current, option] }));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of form.fields) {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
          alert(`Please complete the required field: "${field.label}"`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await submitForm(form.id, {
        formId: form.id,
        activityId: form.activityId,
        userId: userProfile?.uid || 'guest-01',
        userEmail: userProfile?.email || 'student@mba.edu',
        userName: userProfile?.displayName || 'MBA Student',
        userRollNumber: userProfile?.rollNumber || '',
        userPosition: userProfile?.position || 'Student',
        responses: answers,
        status: 'pending',
      });
      setSubmittedSuccess(true);
    } catch (err) {
      alert('Error submitting form: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (submissionId: string, newStatus: SubmissionStatus) => {
    try {
      await updateSubmissionStatus(form.id, submissionId, newStatus);
    } catch (err) {
      alert('Failed to update status: ' + err);
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('No submissions to export yet.');
      return;
    }

    // Generate CSV Header
    const headers = ['Submission ID', 'Submitted At', 'Roll Number', 'Candidate Name', 'Position', 'Email', 'Status'];
    form.fields.forEach(f => headers.push(`"${f.label.replace(/"/g, '""')}"`));

    // Generate Rows
    const rows = submissions.map(sub => {
      const row = [
        sub.id,
        new Date(sub.submittedAt).toLocaleString(),
        `"${sub.userRollNumber || ''}"`,
        `"${sub.userName || ''}"`,
        `"${sub.userPosition || ''}"`,
        `"${sub.userEmail || ''}"`,
        sub.status,
      ];
      form.fields.forEach(f => {
        const val = sub.responses[f.id];
        if (Array.isArray(val)) {
          row.push(`"${val.join(', ').replace(/"/g, '""')}"`);
        } else if (val !== undefined && val !== null) {
          row.push(`"${String(val).replace(/"/g, '""')}"`);
        } else {
          row.push('""');
        }
      });
      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDeleteForm = async () => {
    if (confirm(`Are you sure you want to delete form "${form.title}" and all its submissions?`)) {
      try {
        await deleteForm(form.id);
        onBack();
      } catch (err) {
        alert('Failed to delete form: ' + err);
      }
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Forms</span>
        </button>

        <div className="flex items-center gap-2">
          {/* View switcher for organizers */}
          {isFaculty && (
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveView('fill')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'fill'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Registration Form
              </button>
              <button
                onClick={() => setActiveView('responses')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'responses'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Responses ({submissions.length})</span>
              </button>
            </div>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>

          {isFaculty && (
            <button
              onClick={() => onEdit(form)}
              className="p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
              title="Edit Form"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDeleteForm}
              className="p-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-100"
              title="Delete Form"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main View: Fill Form vs Manage Submissions */}
      {activeView === 'fill' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-lg space-y-6">
          {submittedSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Registration Submitted Successfully!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Your response for <strong>{form.title}</strong> has been stored in Firebase Cloud Firestore. Organizers will review your submission.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setSubmittedSuccess(false);
                    setAnswers({});
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                >
                  Submit Another Response
                </button>
                <button
                  onClick={onBack}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Header Box */}
              <div className="border-b border-slate-200 dark:border-slate-700 pb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    MBA Activity Form
                  </span>
                  {form.activityTitle && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      &bull; Event: {form.activityTitle}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {form.title}
                </h1>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {form.description}
                </p>

                {form.deadline && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold pt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Submission Deadline: {form.deadline}</span>
                  </p>
                )}
              </div>

              {/* Dynamic Questions */}
              <div className="space-y-6">
                {form.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {/* Short Text */}
                    {field.type === 'text' && (
                      <input
                        type="text"
                        required={field.required}
                        placeholder={field.placeholder || 'Your answer'}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    )}

                    {/* Paragraph */}
                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        required={field.required}
                        placeholder={field.placeholder || 'Your detailed answer'}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    )}

                    {/* Dropdown */}
                    {field.type === 'select' && (
                      <select
                        required={field.required}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose an option --</option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {/* Radio Single Choice */}
                    {field.type === 'radio' && (
                      <div className="space-y-2 pt-1">
                        {(field.options || []).map((opt, i) => (
                          <label key={i} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={answers[field.id] === opt}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Checkbox Multi Choice */}
                    {field.type === 'checkbox' && (
                      <div className="space-y-2 pt-1">
                        {(field.options || []).map((opt, i) => {
                          const isChecked = ((answers[field.id] as string[]) || []).includes(opt);
                          return (
                            <label key={i} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxToggle(field.id, opt)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Rating 1-5 */}
                    {field.type === 'rating' && (
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isSelected = answers[field.id] === num;
                          return (
                            <button
                              type="button"
                              key={num}
                              onClick={() => handleFieldChange(field.id, num)}
                              className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 mr-1 ${isSelected ? 'fill-current' : ''}`} />
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit CTA */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Logged in as: <strong>{userProfile?.displayName}</strong> ({userProfile?.email})
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting to Firestore...' : 'Submit Form'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Organizer Responses Table */
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Submissions & RSVPs</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {submissions.length} total
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time Firestore responses from MBA students & participants.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Statuses ({submissions.length})</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Participant</th>
                    <th className="px-4 py-3">Submitted At</th>
                    {form.fields.slice(0, 3).map((f) => (
                      <th key={f.id} className="px-4 py-3 max-w-[160px] truncate">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {sub.userName || 'Anonymous Student'}
                          </span>
                          {sub.userRollNumber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {sub.userRollNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{sub.userEmail}</span>
                          {sub.userPosition && (
                            <span>&bull; {sub.userPosition}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(sub.submittedAt).toLocaleDateString()} &bull; {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      {form.fields.slice(0, 3).map((f) => {
                        const val = sub.responses[f.id];
                        return (
                          <td key={f.id} className="px-4 py-3 max-w-[160px] truncate text-slate-800 dark:text-slate-200">
                            {Array.isArray(val) ? val.join(', ') : val !== undefined ? String(val) : '-'}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : sub.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : sub.status === 'waitlisted'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStatusChange(sub.id, 'approved')}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            title="Approve registration"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(sub.id, 'waitlisted')}
                            className="p-1 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 text-[10px] font-bold"
                            title="Move to waitlist"
                          >
                            W
                          </button>
                          <button
                            onClick={() => handleStatusChange(sub.id, 'rejected')}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={5 + form.fields.slice(0, 3).length} className="px-4 py-10 text-center text-slate-400">
                        No submissions recorded for this form yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
