import React, { useState } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Plus, 
  Upload, 
  Download, 
  Users, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ClubCategory, ClubEventAgenda, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ClubEventsSection } from '../events/ClubEventsSection';

interface StudentPortalProps {
  clubEvents: ClubEventAgenda[];
  clubs: ClubCategory[];
  allStudents: UserProfile[];
  onOpenCreateClubEvent: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  clubEvents,
  clubs,
  allStudents,
  onOpenCreateClubEvent,
}) => {
  const { userProfile } = useAuth();
  const [studentTab, setStudentTab] = useState<'club_events' | 'my_participations'>('club_events');

  const position = (userProfile?.position || 'Member').trim();
  const isSecretary = position.toLowerCase() === 'secretary';
  const isExecutive = position.toLowerCase() === 'executive';
  const isNormalMember = !isSecretary && !isExecutive;

  // Check which events current student is selected as a participant or Incharge
  const currentRoll = (userProfile?.rollNumber || '').toUpperCase();
  const myEvents = clubEvents.filter((ev) => {
    const isIncharge = (ev.eventInchargeRoll || '').toUpperCase() === currentRoll;
    const isParticipant = (ev.participants || []).some(p => (p.rollNumber || '').toUpperCase() === currentRoll);
    const isCreator = (ev.createdExecutiveRoll || '').toUpperCase() === currentRoll;
    return isIncharge || isParticipant || isCreator;
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Student Profile Banner (Light Theme) */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-700 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white/20 text-white">
                Roll No: {userProfile?.rollNumber || '25MBA001'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
                isSecretary
                  ? 'bg-amber-400 text-slate-900'
                  : isExecutive
                  ? 'bg-emerald-400 text-slate-900'
                  : 'bg-white/30 text-white'
              }`}>
                Position: {position}
              </span>
              {userProfile?.club && (
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white/10 text-white">
                  Club: {userProfile.club}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-white">
              {userProfile?.displayName || 'MBA Candidate'}
            </h1>

            <p className="text-xs text-blue-100">
              <span>{userProfile?.yearOfStudying || '1st Year (2025-2027)'}</span>
              <span className="mx-2">&bull;</span>
              <span>{userProfile?.department || 'MBA Department'}</span>
            </p>
          </div>

          {/* Secretary & Executive Privilege Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {(isSecretary || isExecutive) && (
              <button
                onClick={onOpenCreateClubEvent}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-indigo-900 shadow-sm hover:bg-slate-100 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Create Event Agenda (8 Participants)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setStudentTab('club_events')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            studentTab === 'club_events'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Club Agendas & Approvals ({clubEvents.length})</span>
        </button>

        <button
          onClick={() => setStudentTab('my_participations')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            studentTab === 'my_participations'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>My Assigned Events & Incharge ({myEvents.length})</span>
        </button>

      </div>

      {/* 1. CLUB EVENTS & AGENDA LIST */}
      {studentTab === 'club_events' && (
        <ClubEventsSection
          events={clubEvents}
          clubs={clubs}
          onOpenCreateModal={onOpenCreateClubEvent}
          canCreateEvent={isSecretary || isExecutive}
        />
      )}

      {/* 2. MY ASSIGNED PARTICIPATIONS & INCHARGE */}
      {studentTab === 'my_participations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              Events Assigned to Roll No: {userProfile?.rollNumber}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Events where you are designated as the Event Incharge, selected as one of the 8 participants, or creator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEvents.map((ev) => {
              const isIncharge = (ev.eventInchargeRoll || '').toUpperCase() === currentRoll;
              return (
                <div key={ev.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                      {ev.club}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {isIncharge ? 'You are Event Incharge' : 'Selected Participant'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-600">{ev.description}</p>

                  <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                    <div>Date: <strong>{ev.date} ({ev.startTime} - {ev.endTime})</strong></div>
                    <div>Venue: <strong>{ev.venue}</strong></div>
                    <div>Event Incharge: <strong>{ev.eventInchargeName} ({ev.eventInchargeRoll})</strong></div>
                  </div>
                </div>
              );
            })}

            {myEvents.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                You are not currently designated as Incharge or selected in any active event roster.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
