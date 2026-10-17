import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StudentLogin } from './components/student/StudentLogin';
import { ProfileSetup } from './components/student/ProfileSetup';
import { StudentPortal } from './components/student/StudentPortal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { EventAgendaModal } from './components/events/EventAgendaModal';
import { ClubCategory, ClubEventAgenda, UserProfile } from './types';
import { subscribeToUsers } from './services/userService';
import { subscribeToClubEvents, subscribeToClubs } from './services/clubEventService';

function MainApp() {
  const { userProfile, syncProfile } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clubEvents, setClubEvents] = useState<ClubEventAgenda[]>([]);
  const [clubs, setClubs] = useState<ClubCategory[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    const unsubUsers = subscribeToUsers((d) => setUsers(d), (e) => console.error('Users sub error:', e));
    const unsubEvents = subscribeToClubEvents((d) => setClubEvents(d), (e) => console.error('Club events sub error:', e));
    const unsubClubs = subscribeToClubs((d) => setClubs(d), (e) => console.error('Clubs sub error:', e));
    return () => { unsubUsers(); unsubEvents(); unsubClubs(); };
  }, [userProfile?.uid]);

  // Keep the signed-in profile in sync with the database (e.g. department set by faculty)
  const liveProfile = userProfile ? users.find((u) => u.uid === userProfile.uid) : undefined;
  useEffect(() => {
    if (!liveProfile || !userProfile) return;
    const changed =
      liveProfile.updatedAt !== userProfile.updatedAt ||
      liveProfile.position !== userProfile.position ||
      liveProfile.club !== userProfile.club ||
      liveProfile.department !== userProfile.department ||
      liveProfile.displayName !== userProfile.displayName ||
      liveProfile.gender !== userProfile.gender ||
      liveProfile.status !== userProfile.status;
    if (changed) syncProfile(liveProfile);
  }, [liveProfile?.updatedAt, liveProfile?.position, liveProfile?.club, liveProfile?.department, liveProfile?.displayName, liveProfile?.gender, liveProfile?.status]);

  if (!userProfile) return <StudentLogin />;

  // First login: student must complete the profile step
  if (!userProfile.profileCompleted && !liveProfile?.profileCompleted) {
    return <ProfileSetup profile={liveProfile || userProfile} />;
  }

  const studentUsers = users.filter((u) => u.role === 'student');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors">
      <Navbar
        currentTab="student_portal"
        setCurrentTab={() => {}}
        openChangePasswordModal={() => setIsPasswordModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <StudentPortal
          clubEvents={clubEvents}
          clubs={clubs}
          allStudents={studentUsers}
          onOpenCreateClubEvent={() => setIsEventModalOpen(true)}
        />
      </main>

      <EventAgendaModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        clubs={clubs}
        allStudents={studentUsers}
        allEvents={clubEvents}
        onEventCreated={() => setIsEventModalOpen(false)}
      />

      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
