import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  ArrowLeft, 
  Layers, 
  CheckSquare, 
  CircleDot, 
  AlignLeft, 
  Type, 
  ListOrdered, 
  Star,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Activity, DynamicForm, FormField, FormFieldType } from '../types';
import { useAuth } from '../context/AuthContext';
import { createForm, updateForm } from '../services/formService';

interface FormCreationProps {
  activities: Activity[];
  initialForm?: DynamicForm | null;
  linkedActivity?: Activity | null;
  onSaved: (form: DynamicForm) => void;
  onCancel: () => void;
}

export const FormCreation: React.FC<FormCreationProps> = ({
  activities,
  initialForm,
  linkedActivity,
  onSaved,
  onCancel,
}) => {
  const { userProfile } = useAuth();
  
  const [title, setTitle] = useState(initialForm?.title || (linkedActivity ? `Registration: ${linkedActivity.title}` : ''));
  const [description, setDescription] = useState(initialForm?.description || 'Please fill in your details to register for this MBA activity.');
  const [activityId, setActivityId] = useState(initialForm?.activityId || linkedActivity?.id || '');
  const [deadline, setDeadline] = useState(initialForm?.deadline || '');
  const [isPublished, setIsPublished] = useState(initialForm ? initialForm.isPublished : true);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(initialForm?.allowMultipleSubmissions || false);
  
  const defaultFields: FormField[] = initialForm?.fields || [
    {
      id: 'f_1',
      label: 'Full Name',
      type: 'text',
      placeholder: 'First and Last name',
      required: true,
    },
    {
      id: 'f_2',
      label: 'Student / Roll ID',
      type: 'text',
      placeholder: 'e.g. MBA-2025-042',
      required: true,
    },
    {
      id: 'f_3',
      label: 'MBA Specialization',
      type: 'select',
      options: ['Strategy & Management', 'Finance & Investment Banking', 'Marketing & E-Commerce', 'Operations & Analytics', 'Human Resources'],
      required: true,
    },
    {
      id: 'f_4',
      label: 'What do you hope to gain from this activity?',
      type: 'textarea',
      placeholder: 'Share your learning objectives...',
      required: false,
    }
  ];

  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build');
  const [saving, setSaving] = useState(false);

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: type === 'rating' ? 'Rate your previous preparation (1-5)' : 'New Question',
      type,
      placeholder: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleOptionsChange = (id: string, rawText: string) => {
    const opts = rawText.split('\n').map(s => s.trim()).filter(Boolean);
    updateField(id, { options: opts });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please provide a form title.');
      return;
    }
    if (fields.length === 0) {
      alert('Please add at least one form field.');
      return;
    }

    setSaving(true);
    const selectedAct = activities.find(a => a.id === activityId);

    try {
      if (initialForm) {
        await updateForm(initialForm.id, {
          title,
          description,
          activityId: activityId || undefined,
          activityTitle: selectedAct?.title || undefined,
          deadline: deadline || undefined,
          isPublished,
          allowMultipleSubmissions,
          fields,
        });
        onSaved({
          ...initialForm,
          title,
          description,
          activityId,
          activityTitle: selectedAct?.title,
          deadline,
          isPublished,
          allowMultipleSubmissions,
          fields,
          updatedAt: new Date().toISOString()
        });
      } else {
        const created = await createForm({
          title,
          description,
          activityId: activityId || undefined,
          activityTitle: selectedAct?.title || undefined,
          createdBy: userProfile?.uid || 'faculty-01',
          createdByName: userProfile?.displayName || 'Faculty Member',
          deadline: deadline || undefined,
          isPublished,
          allowMultipleSubmissions,
          fields,
        });
        onSaved(created);
      }
    } catch (err) {
      alert('Failed to save form: ' + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Forms</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Builder vs Preview Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('build')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'build'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Form Builder
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Submitting...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'build' ? (
        <div className="space-y-6">
          {/* Form Metadata Section */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Form Configuration</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Form Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Case Competition Team Registration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Tell respondents what this form is for, eligibility criteria, and deadlines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link to MBA Activity (Optional)
                </label>
                <select
                  value={activityId}
                  onChange={(e) => setActivityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">-- No specific activity link --</option>
                  {activities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.title} ({act.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Submission Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Published & Accepting Responses</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={allowMultipleSubmissions}
                  onChange={(e) => setAllowMultipleSubmissions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Allow Multiple Submissions per user</span>
              </label>
            </div>
          </div>

          {/* Form Field List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Form Questions & Fields ({fields.length})
              </h3>
            </div>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Question / Label"
                      className="flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { 
                        type: e.target.value as FormFieldType,
                        options: ['select', 'radio', 'checkbox'].includes(e.target.value) && !field.options 
                          ? ['Option 1', 'Option 2'] 
                          : field.options
                      })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Paragraph</option>
                      <option value="select">Dropdown Menu</option>
                      <option value="radio">Single Choice (Radio)</option>
                      <option value="checkbox">Multiple Choice (Checkboxes)</option>
                      <option value="rating">Rating (1-5)</option>
                    </select>

                    <button
                      onClick={() => removeField(field.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Remove Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Settings for Select, Radio, Checkbox */}
                {['select', 'radio', 'checkbox'].includes(field.type) && (
                  <div className="pl-8 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Options (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={(field.options || []).join('\n')}
                      onChange={(e) => handleOptionsChange(field.id, e.target.value)}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      className="w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="pl-8 flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span>Required Field</span>
                  </label>

                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Placeholder / Hint text (optional)"
                    className="flex-1 px-2 py-1 rounded-md text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            ))}

            {/* Add Field Palette */}
            <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider text-center">
                + Add A Question Field
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => addField('text')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-xs"
                >
                  <Type className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Short Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => addField('textarea')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-xs"
                >
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Paragraph</span>
                </button>

                <button
                  type="button"
                  onClick={() => addField('select')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-xs"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dropdown Menu</span>
                </button>

                <button
                  type="button"
                  onClick={() => addField('radio')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-xs"
                >
                  <CircleDot className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Single Choice</span>
                </button>

                <button
                  type="button"
                  onClick={() => addField('checkbox')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Multiple Choice</span>
                </button>

                <button
                  type="button"
                  onClick={() => addField('rating')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-xs"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rating Scale</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Preview Mode */
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 border border-slate-200 dark:border-slate-700 shadow-lg space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Form Preview
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {title || 'Untitled Form'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">
              {description}
            </p>
            {deadline && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-semibold">
                Submission Deadline: {deadline}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  {field.label} {field.required && <span className="text-slate-500">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    disabled
                    placeholder={field.placeholder || 'Your response...'}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-80"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={3}
                    disabled
                    placeholder={field.placeholder || 'Your response...'}
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-80"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-80"
                  >
                    <option>Select an option...</option>
                    {(field.options || []).map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === 'radio' && (
                  <div className="space-y-1.5 pt-1">
                    {(field.options || []).map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <input type="radio" disabled name={field.id} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <div className="space-y-1.5 pt-1">
                    {(field.options || []).map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <input type="checkbox" disabled />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'rating' && (
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div
                        key={num}
                        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              disabled
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white opacity-60 cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
