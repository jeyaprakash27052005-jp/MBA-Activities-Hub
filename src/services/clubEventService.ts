import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { ClubCategory, ClubEventAgenda, EventApprovalStatus, EventFileAttachment, EventParticipant } from '../types';
import { createActivity } from './activityService';

const CLUB_EVENTS_COLLECTION = 'club_events';
const CLUBS_COLLECTION = 'clubs';

export const INITIAL_CLUBS: ClubCategory[] = [
  { id: 'nism', name: 'NISM', description: 'National Institute of Securities Markets - Finance & Capital Markets Club' },
  { id: 'nipm', name: 'NIPM', description: 'National Institute of Personnel Management - Human Resources Club' },
  { id: 'ad_club', name: 'Ad Club', description: 'Advertising, Media & Creative Marketing Club' },
  { id: 'student_activity', name: 'Student Activity', description: 'Inter-Cohort Cultural, Sports & General MBA Activities' },
];

export const subscribeToClubEvents = (
  onData: (events: ClubEventAgenda[]) => void,
  onError?: (err: Error) => void
) => {
  const q = query(collection(db, CLUB_EVENTS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: ClubEventAgenda[] = [];
      snap.forEach((d) => {
        list.push(d.data() as ClubEventAgenda);
      });
      onData(list);
    },
    (err) => {
      console.warn('Club events listener notice:', err);
      if (onError) onError(err);
    }
  );
};

export const subscribeToClubs = (
  onData: (clubs: ClubCategory[]) => void,
  onError?: (err: Error) => void
) => {
  const q = query(collection(db, CLUBS_COLLECTION), orderBy('name', 'asc'));

  return onSnapshot(
    q,
    async (snap) => {
      if (snap.empty) {
        // Seed default 4 clubs
        for (const c of INITIAL_CLUBS) {
          try {
            await setDoc(doc(db, CLUBS_COLLECTION, c.id), c);
          } catch (e) {
            // Ignored
          }
        }
        onData(INITIAL_CLUBS);
      } else {
        const list: ClubCategory[] = [];
        snap.forEach((d) => list.push(d.data() as ClubCategory));
        onData(list);
      }
    },
    (err) => {
      console.warn('Clubs listener notice:', err);
      onData(INITIAL_CLUBS);
      if (onError) onError(err);
    }
  );
};

export const addCustomClub = async (name: string, description: string, createdBy: string): Promise<ClubCategory> => {
  const id = `club_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const newClub: ClubCategory = {
    id,
    name: name.trim(),
    description: description.trim(),
    isCustom: true,
    createdBy,
  };
  await setDoc(doc(db, CLUBS_COLLECTION, id), newClub);
  return newClub;
};

// Returns set of roll numbers already booked in active/pending events so another executive cannot select them!
export const getActiveSelectedParticipantRolls = (allEvents: ClubEventAgenda[], excludeEventId?: string): Set<string> => {
  const booked = new Set<string>();
  allEvents.forEach((ev) => {
    if (ev.id !== excludeEventId && (ev.status === 'pending_secretary_approval' || ev.status === 'approved' || ev.status === 'needs_revision')) {
      (ev.participants || []).forEach((p) => {
        if (p.rollNumber) booked.add(p.rollNumber.toUpperCase());
      });
      if (ev.eventInchargeRoll) {
        booked.add(ev.eventInchargeRoll.toUpperCase());
      }
    }
  });
  return booked;
};

export const createClubEventAgenda = async (
  eventData: Omit<ClubEventAgenda, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<ClubEventAgenda> => {
  const id = `clevt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newEvent: ClubEventAgenda = {
    ...eventData,
    id,
    status: 'pending_secretary_approval',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, CLUB_EVENTS_COLLECTION, id), newEvent);
  return newEvent;
};

export const reviewEventBySecretary = async (
  eventId: string,
  decision: 'approve' | 'reject' | 'needs_revision',
  secretaryName: string,
  secretaryRoll: string,
  notes?: string
): Promise<void> => {
  const docRef = doc(db, CLUB_EVENTS_COLLECTION, eventId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Event not found');

  const ev = snap.data() as ClubEventAgenda;
  const now = new Date().toISOString();

  const statusMap: Record<string, EventApprovalStatus> = {
    approve: 'approved',
    reject: 'rejected',
    needs_revision: 'needs_revision',
  };

  const newStatus = statusMap[decision];

  await updateDoc(docRef, {
    status: newStatus,
    secretaryApprovalNotes: notes || '',
    reviewedBySecretaryName: secretaryName,
    reviewedBySecretaryRoll: secretaryRoll,
    reviewedAt: now,
    updatedAt: now,
  });

  // If approved by Secretary: AUTOMATICALLY publish to the public Activities Agenda!
  if (decision === 'approve') {
    try {
      await createActivity({
        title: `[${ev.club}] ${ev.title}`,
        category: 'club_event',
        date: ev.date || new Date().toISOString().split('T')[0],
        startTime: ev.startTime || '10:00',
        endTime: ev.endTime || '12:00',
        venue: ev.venue || 'MBA Seminar Hall',
        speaker: `Event Incharge: ${ev.eventInchargeName} (${ev.eventInchargeRoll})`,
        organizerId: ev.createdExecutiveRoll,
        organizerName: `${ev.createdExecutiveName} (Executive) & ${secretaryName} (Secretary)`,
        maxParticipants: 8,
        status: 'upcoming',
        club: ev.club,
        description: `${ev.description}\n\nParticipants (8):\n${ev.participants.map((p, i) => `${i + 1}. ${p.name} (${p.rollNumber})`).join('\n')}`,
      });
    } catch (e) {
      console.warn('Auto-create activity note:', e);
    }
  }
};

export const reuploadEventFiles = async (
  eventId: string,
  newFiles: EventFileAttachment[]
): Promise<void> => {
  const docRef = doc(db, CLUB_EVENTS_COLLECTION, eventId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    files: newFiles,
    status: 'pending_secretary_approval', // Re-submits for secretary review
    updatedAt: now,
  });
};
