import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Film, 
  Presentation, 
  Check, 
  Users, 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';
import { ClubCategory, ClubEventAgenda, EventFileAttachment, EventParticipant, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createClubEventAgenda, getActiveSelectedParticipantRolls } from '../../services/clubEventService';

interface EventAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubs: ClubCategory[];
  allStudents: UserProfile[];
  allEvents: ClubEventAgenda[];
  onEventCreated: (event: ClubEventAgenda) => void;
}

export const EventAgendaModal: React.FC<EventAgendaModalProps> = ({
  isOpen,
  onClose,
  clubs,
  allStudents,
  allEvents,
  onEventCreated,
}) => {
  const { userProfile, role, isAdmin, isFaculty } = useAuth();

  const [title, setTitle] = useState('');
  const [selectedClub, setSelectedClub] = useState(clubs[0]?.name || 'NISM');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:30');
  const [venue, setVenue] = useState('MBA Seminar Hall 1');
  const [description, setDescription] = useState('');

  // Event Incharge (selected from students)
  const [inchargeRoll, setInchargeRoll] = useState('');

  // 8 Participants selected by Executive
  const [selectedParticipants, setSelectedParticipants] = useState<EventParticipant[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Uploaded Files (PPT, Video, PDF)
  const [files, setFiles] = useState<EventFileAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate already booked members across all active events so another Executive cannot pick them!
  const bookedRolls = getActiveSelectedParticipantRolls(allEvents);

  // Available students for participants (must NOT be already selected by another Executive)
  const availableStudents = allStudents.filter((st) => {
    const r = (st.rollNumber || '').toUpperCase();
    if (!r) return false;
    // Hide if already selected in another active event
    if (bookedRolls.has(r)) return false;
    return true;
  });

  const searchedAvailableStudents = availableStudents.filter((st) => {
    const q = participantSearch.toLowerCase();
    return (
      st.displayName.toLowerCase().includes(q) ||
      (st.rollNumber && st.rollNumber.toLowerCase().includes(q))
    );
  });

  // Handle picking or removing a participant (max 8)
  const toggleParticipant = (st: UserProfile) => {
    const exists = selectedParticipants.some(p => p.rollNumber === st.rollNumber);
    if (exists) {
      setSelectedParticipants(selectedParticipants.filter(p => p.rollNumber !== st.rollNumber));
    } else {
      if (selectedParticipants.length >= 8) {
        alert('Exactly 8 participants can be selected for this event.');
        return;
      }
      setSelectedParticipants([
        ...selectedParticipants,
        {
          rollNumber: st.rollNumber || '',
          name: st.displayName,
          selectedByExecutiveRoll: userProfile?.rollNumber || 'EXECUTIVE',
        }
      ]);
    }
  };

  // Handle File Uploads: PPT, Video, PDF only
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    setFileError(null);
    const newAttachments: EventFileAttachment[] = [];

    Array.from(uploaded).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'ppt' | 'video' | 'pdf' | null = null;

      if (ext === 'ppt' || ext === 'pptx') fileType = 'ppt';
      else if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext || '')) fileType = 'video';
      else if (ext === 'pdf') fileType = 'pdf';

      if (!fileType) {
        setFileError(`File "${file.name}" rejected. Only PowerPoint (.ppt, .pptx), Video, or PDF files are allowed.`);
        return;
      }

      // Check file size (limit 25MB for browser Base64 safety)
      if (file.size > 25 * 1024 * 1024) {
        setFileError(`File "${file.name}" is too large (max 25MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setFiles(prev => [
          ...prev,
          {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: fileType as any,
            size: file.size,
            dataUrl,
            uploadedAt: new Date().toISOString(),
            uploadedByName: userProfile?.displayName || 'Executive',
            uploadedByRoll: userProfile?.rollNumber || '',
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter event title');
      return;
    }

    if (!inchargeRoll) {
      alert('Please select the Event Incharge');
      return;
    }

    if (selectedParticipants.length !== 8) {
      alert(`Please select exactly 8 participants. Currently selected: ${selectedParticipants.length}`);
      return;
    }

    if (files.length === 0) {
      alert('Please upload required event presentation files (PPT, Video, or PDF).');
      return;
    }

    setSubmitting(true);
    try {
      const inchargeStudent = allStudents.find(s => s.rollNumber === inchargeRoll);
      const created = await createClubEventAgenda({
        title,
        club: selectedClub,
        date: eventDate,
        startTime,
        endTime,
        venue,
        description,
        eventInchargeName: inchargeStudent?.displayName || `Student ${inchargeRoll}`,
        eventInchargeRoll: inchargeRoll,
        createdExecutiveRoll: userProfile?.rollNumber || 'ADMIN',
        createdExecutiveName: userProfile?.displayName || 'Head Admin',
        participants: selectedParticipants,
        files,
      });

      onEventCreated(created);
      onClose();
    } catch (err: any) {
      alert('Failed to create club event: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
              Club Agenda Creation Form
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Create Club Event & Agenda
            </h2>
            <p className="text-xs text-slate-500">
              Select 8 participants (hidden from other events), assign Incharge, and upload presentation files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Title & Club Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Title of the Event *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NISM Financial Derivatives & Stock Simulation 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Club / Category *
              </label>
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 font-semibold"
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time, Venue */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Date *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Venue</label>
              <input
                type="text"
                placeholder="Room / Hall"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* Name of Event Incharge */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Name of Event Incharge *</span>
              <span className="text-[11px] text-indigo-600 font-normal">
                Will be displayed as Incharge on the Event
              </span>
            </label>
            <select
              required
              value={inchargeRoll}
              onChange={(e) => setInchargeRoll(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-300 text-slate-900 font-medium"
            >
              <option value="">-- Select Event Incharge (Student Member) --</option>
              {allStudents.map((st) => (
                <option key={st.uid} value={st.rollNumber}>
                  {st.displayName} ({st.rollNumber || 'No Roll'}) &bull; Position: {st.position || 'Member'}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Agenda & Objectives Description
            </label>
            <textarea
              rows={2}
              placeholder="Detail session flow, materials needed, round details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900"
            />
          </div>

          {/* SELECT 8 PARTICIPANTS SECTION */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Select 8 Event Participants</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                    selectedParticipants.length === 8 ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {selectedParticipants.length} / 8 Selected
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Selected by Executive. Members booked in other active events are automatically hidden.
                </p>
              </div>

              <input
                type="text"
                placeholder="Filter members..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 sm:w-48"
              />
            </div>

            {/* Currently Selected 8 Chips */}
            {selectedParticipants.length > 0 && (
              <div className="p-2.5 rounded-xl bg-white border border-indigo-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider block">
                  Chosen 8 Participants (Under Event Incharge):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedParticipants.map((p, idx) => (
                    <span 
                      key={p.rollNumber}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300"
                    >
                      <span className="font-mono font-bold text-indigo-600">{idx + 1}. {p.rollNumber}</span>
                      <span>{p.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedParticipants(selectedParticipants.filter(x => x.rollNumber !== p.rollNumber))}
                        className="text-indigo-400 hover:text-slate-900 ml-1 font-bold"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Available Members Grid to Pick From */}
            <div className="max-h-36 overflow-y-auto rounded-xl bg-white border border-slate-200 p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {searchedAvailableStudents.slice(0, 40).map((st) => {
                const isChosen = selectedParticipants.some(p => p.rollNumber === st.rollNumber);
                return (
                  <button
                    key={st.uid}
                    type="button"
                    onClick={() => toggleParticipant(st)}
                    className={`text-left p-2 rounded-lg text-xs transition-all border ${
                      isChosen
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] truncate">{st.rollNumber}</span>
                      {isChosen && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                    <div className="text-[11px] truncate">{st.displayName}</div>
                  </button>
                );
              })}

              {searchedAvailableStudents.length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                  No available members matching search or all are booked in active events.
                </div>
              )}
            </div>
          </div>

          {/* FILE UPLOAD SECTION: PPT, VIDEO, PDF ONLY */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Upload Presentation Files * (PPT, Video, PDF Only)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Files stored securely in database for Secretary download & review
              </span>
            </label>

            {fileError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <input
                type="file"
                multiple
                accept=".ppt,.pptx,video/*,.pdf"
                onChange={handleFileUpload}
                id="file-upload-input"
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-1">
                <Upload className="w-6 h-6 text-indigo-500 mx-auto" />
                <span className="text-xs font-bold text-indigo-600 hover:underline block">
                  Click to select Presentation Files (.ppt, .pptx, videos, .pdf)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Only PPT, PPTX, Video, and PDF formats accepted
                </span>
              </label>
            </div>

            {/* Uploaded File List */}
            {files.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {files.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.type === 'ppt' ? (
                        <Presentation className="w-4 h-4 text-orange-500 shrink-0" />
                      ) : file.type === 'video' ? (
                        <Film className="w-4 h-4 text-purple-500 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Event will be routed to the <strong>Club Secretary</strong> for approval before publishing.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 transition-all hover:scale-[1.01]"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
