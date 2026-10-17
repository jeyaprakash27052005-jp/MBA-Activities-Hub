import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Presentation, 
  Film, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Upload, 
  Plus, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ClubCategory, ClubEventAgenda, EventApprovalStatus, EventFileAttachment, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { reviewEventBySecretary, reuploadEventFiles, fetchEventFileDataUrl } from '../../services/clubEventService';

interface ClubEventsSectionProps {
  events: ClubEventAgenda[];
  clubs: ClubCategory[];
  onOpenCreateModal: () => void;
  canCreateEvent: boolean;
  allStudents?: UserProfile[];
}

export const ClubEventsSection: React.FC<ClubEventsSectionProps> = ({
  events,
  clubs,
  onOpenCreateModal,
  canCreateEvent,
  allStudents = [],
}) => {
  // Live gender lookup (falls back to the gender saved with the event)
  const genderOf = (roll?: string, fallback?: string) => {
    const st = allStudents.find((s) => (s.rollNumber || '').toUpperCase() === (roll || '').toUpperCase());
    return st?.gender || fallback || '';
  };

  const { userProfile, role, isAdmin, isFaculty } = useAuth();
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal for Secretary Revision Notes
  const [revisionModalEvent, setRevisionModalEvent] = useState<ClubEventAgenda | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Modal for Re-uploading Files
  const [reuploadEvent, setReuploadEvent] = useState<ClubEventAgenda | null>(null);
  const [reuploadFiles, setReuploadFiles] = useState<EventFileAttachment[]>([]);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [reuploading, setReuploading] = useState(false);

  // Check if current user has Secretary rights (or Admin)
  const isSecretary = 
    isAdmin || 
    (userProfile?.position || '').toLowerCase().includes('secretary') ||
    userProfile?.role === 'admin';

  const filteredEvents = events.filter((ev) => {
    const matchesClub = selectedClubFilter === 'all' || ev.club === selectedClubFilter;
    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchesClub && matchesStatus;
  });

  const handleApprove = async (ev: ClubEventAgenda) => {
    if (!confirm(`Approve event "${ev.title}"? It will automatically be published to the Activities Agenda.`)) return;
    try {
      await reviewEventBySecretary(
        ev.id,
        'approve',
        userProfile?.displayName || 'Club Secretary',
        userProfile?.rollNumber || 'SECRETARY'
      );
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    }
  };

  const handleOpenRevisionModal = (ev: ClubEventAgenda) => {
    setRevisionModalEvent(ev);
    setRevisionNote(ev.secretaryApprovalNotes || 'Please correct the presentation slides and re-upload the PPT file.');
  };

  const submitRevisionRequest = async () => {
    if (!revisionModalEvent) return;
    setReviewing(true);
    try {
      await reviewEventBySecretary(
        revisionModalEvent.id,
        'needs_revision',
        userProfile?.displayName || 'Club Secretary',
        userProfile?.rollNumber || 'SECRETARY',
        revisionNote
      );
      setRevisionModalEvent(null);
    } catch (err: any) {
      alert('Failed to request revision: ' + err.message);
    } finally {
      setReviewing(false);
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadFile = async (eventId: string, file: EventFileAttachment) => {
    setDownloadingId(file.id);
    try {
      const dataUrl = await fetchEventFileDataUrl(eventId, file);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Download failed: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Re-upload files handling
  const handleReuploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    setReuploadError(null);
    const newAttachments: EventFileAttachment[] = [];

    Array.from(uploaded).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'ppt' | 'video' | 'pdf' | null = null;
      if (ext === 'ppt' || ext === 'pptx') fileType = 'ppt';
      else if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext || '')) fileType = 'video';
      else if (ext === 'pdf') fileType = 'pdf';

      if (!fileType) {
        setReuploadError(`File "${file.name}" rejected. Only PPT, Video, and PDF allowed.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setReuploadFiles(prev => [
          ...prev,
          {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: fileType as any,
            size: file.size,
            dataUrl: reader.result as string,
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

  const submitReupload = async () => {
    if (!reuploadEvent) return;
    if (reuploadFiles.length === 0) {
      alert('Please select at least one revised file.');
      return;
    }

    setReuploading(true);
    try {
      await reuploadEventFiles(reuploadEvent.id, reuploadFiles);
      setReuploadEvent(null);
      setReuploadFiles([]);
    } catch (err: any) {
      alert('Re-upload failed: ' + err.message);
    } finally {
      setReuploading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>Club Event Agendas & Secretary Approvals</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            NISM &bull; NIPM &bull; Ad Club &bull; Student Activity. Events require Secretary verification to publish.
          </p>
        </div>

        {canCreateEvent && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event Agenda (8 Participants)</span>
          </button>
        )}
      </div>

      {/* Filter and Club Selection bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Club Categories Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedClubFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedClubFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Clubs ({events.length})
            </button>
            {clubs.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClubFilter(c.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedClubFilter === c.name
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700"
          >
            <option value="all">All Approval Statuses</option>
            <option value="pending_secretary_approval">Pending Secretary Approval</option>
            <option value="approved">Approved & Published</option>
            <option value="needs_revision">Needs Revision / Remarks</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((ev) => {
          const isPending = ev.status === 'pending_secretary_approval';
          const isApproved = ev.status === 'approved';
          const isRevision = ev.status === 'needs_revision';
          const isRejected = ev.status === 'rejected';

          return (
            <div 
              key={ev.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {ev.club}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : isPending
                      ? 'bg-amber-100 text-amber-800'
                      : isRevision
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {isApproved ? 'Approved by Secretary' : isPending ? 'Pending Secretary Review' : isRevision ? 'Revision Requested' : 'Rejected'}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {ev.description}
                  </p>
                </div>

                {/* Event Schedule Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{ev.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{ev.startTime} - {ev.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.venue}</span>
                  </div>
                </div>

                {/* Event Incharge Display */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Name of Event Incharge:
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{ev.eventInchargeName} <span className="font-normal text-slate-500">({genderOf(ev.eventInchargeRoll, ev.eventInchargeGender) || 'Gender N/A'})</span></span>
                    <span className="font-mono text-indigo-600">{ev.eventInchargeRoll}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Created by Executive: <strong>{ev.createdExecutiveName}</strong> ({ev.createdExecutiveRoll})
                  </div>
                </div>

                {/* 8 Selected Participants Roster */}
                <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                    <span>Selected 8 Participants</span>
                    <span className="text-[10px] font-mono text-indigo-600">
                      {(() => {
                        const ps = ev.participants || [];
                        const male = ps.filter((p) => genderOf(p.rollNumber, p.gender) === 'Male').length;
                        const female = ps.filter((p) => genderOf(p.rollNumber, p.gender) === 'Female').length;
                        const other = ps.length - male - female;
                        return `Male ${male} \u2022 Female ${female}` + (other > 0 ? ` \u2022 Other/NA ${other}` : '');
                      })()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {(ev.participants || []).map((p, idx) => (
                      <div key={idx} className="p-1 rounded bg-white border border-indigo-100 truncate">
                        <span className="font-mono font-bold text-indigo-600 mr-1">{p.rollNumber}:</span>
                        <span className="text-slate-800">{p.name}</span>
                        <span className="text-slate-500 ml-1">({genderOf(p.rollNumber, p.gender) || 'Gender N/A'})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Uploaded Files (PPT, Video, PDF) with Download for Secretary */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Attached Files ({(ev.files || []).length}):
                  </span>
                  <div className="space-y-1">
                    {(ev.files || []).map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {file.type === 'ppt' ? (
                            <Presentation className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          ) : file.type === 'video' ? (
                            <Film className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                        </div>

                        {/* Download Option for Secretary & Users */}
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(ev.id, file)}
                          disabled={downloadingId === file.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 shadow-2xs transition-colors shrink-0"
                          title="Download file from database"
                        >
                          <Download className="w-3 h-3" />
                          <span>{downloadingId === file.id ? 'Loading...' : 'Download'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secretary Remarks / Feedback */}
                {ev.secretaryApprovalNotes && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-amber-800">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Secretary Revision Remarks:</span>
                    </div>
                    <p className="text-[11px] whitespace-pre-line leading-relaxed">
                      {ev.secretaryApprovalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                {/* Re-upload button if mistake or needs revision */}
                {(isRevision || isPending) && (
                  <button
                    onClick={() => {
                      setReuploadEvent(ev);
                      setReuploadFiles([]);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Re-upload Corrected Files</span>
                  </button>
                )}

                {/* Secretary Review Buttons */}
                {isSecretary && isPending && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => handleOpenRevisionModal(ev)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                    >
                      Request Revision
                    </button>

                    <button
                      onClick={() => handleApprove(ev)}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Publish to Agenda</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">No club event agendas found</h3>
            <p className="text-xs mt-1">Create an event agenda with 8 participants and presentation files to begin.</p>
          </div>
        )}
      </div>

      {/* Revision Request Modal for Secretary */}
      {revisionModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Request File / Agenda Revision
            </h3>
            <p className="text-xs text-slate-500">
              Inform the Executive and Incharge what mistake should be corrected in the presentation or agenda.
            </p>

            <textarea
              rows={4}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="e.g. Please update slide 4 in the PPT presentation to reflect the updated case guidelines, and re-upload the file."
              className="w-full p-3 rounded-xl text-xs bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRevisionModalEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={submitRevisionRequest}
                disabled={reviewing}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-600 text-white shadow-sm"
              >
                {reviewing ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-upload Files Modal */}
      {reuploadEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Re-upload Corrected Presentation Files
            </h3>
            <p className="text-xs text-slate-500">
              Event: <strong>{reuploadEvent.title}</strong>
            </p>

            {reuploadError && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                {reuploadError}
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50">
              <input
                type="file"
                multiple
                accept=".ppt,.pptx,video/*,.pdf"
                onChange={handleReuploadChange}
                id="reupload-input"
                className="hidden"
              />
              <label htmlFor="reupload-input" className="cursor-pointer block space-y-1">
                <Upload className="w-6 h-6 text-indigo-500 mx-auto" />
                <span className="text-xs font-bold text-indigo-600 hover:underline block">
                  Select new PPT, Video, or PDF files
                </span>
              </label>
            </div>

            {reuploadFiles.length > 0 && (
              <div className="space-y-1">
                {reuploadFiles.map(f => (
                  <div key={f.id} className="p-2 rounded-lg bg-slate-100 text-xs flex justify-between">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setReuploadFiles(reuploadFiles.filter(x => x.id !== f.id))} className="text-slate-500 hover:text-slate-800 font-bold">&times;</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReuploadEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={submitReupload}
                disabled={reuploading}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-sm"
              >
                {reuploading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
