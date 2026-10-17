import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AdminLogin } from './components/admin/AdminLogin';
import { HeadAdminPortal } from './components/admin/HeadAdminPortal';
import { Agenda } from './components/Agenda';
import { FormsList } from './components/FormsList';
import { FormCreation } from './components/FormCreation';
import { FormDetails } from './components/FormDetails';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { EventAgendaModal } from './components/events/EventAgendaModal';
import { Activity, ClubCategory, ClubEventAgenda, DynamicForm, FeatureAccessControls, UserProfile } from './types';
import { subscribeToActivities } from './services/activityService';
import { subscribeToForms } from './services/formService';
import { subscribeToUsers } from './services/userService';
import { subscribeToFeatureControls, DEFAULT_FEATURE_CONTROLS } from './services/settingsService';
import { subscribeToClubEvents, subscribeToClubs } from './services/clubEventService';

function MainApp() {
  const { userProfile, isAdmin, isFaculty } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Firestore Live State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clubEvents, setClubEvents] = useState<ClubEventAgenda[]>([]);
  const [clubs, setClubs] = useState<ClubCategory[]>([]);
  const [featureControls, setFeatureControls] = useState<FeatureAccessControls>(DEFAULT_FEATURE_CONTROLS);

  // Forms Sub-View State
  const [formsView, setFormsView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [editingForm, setEditingForm] = useState<DynamicForm | null>(null);
  const [formLinkedActivity, setFormLinkedActivity] = useState<Activity | null>(null);

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Set initial tab based on role
  useEffect(() => {
    if (userProfile) {
      if (isAdmin) setCurrentTab('admin_portal');
      else if (isFaculty) setCurrentTab('faculty_portal');
    }
  }, [userProfile?.role]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubActivities = subscribeToActivities(
      (data) => setActivities(data),
      (err) => console.error('Activities sub error:', err)
    );

    const unsubForms = subscribeToForms(
      (data) => setForms(data),
      (err) => console.error('Forms sub error:', err)
    );

    const unsubUsers = subscribeToUsers(
      (data) => setUsers(data),
      (err) => console.error('Users sub error:', err)
    );

    const unsubSettings = subscribeToFeatureControls(
      (data) => setFeatureControls(data),
      (err) => console.error('Settings sub error:', err)
    );

    const unsubClubEvents = subscribeToClubEvents(
      (data) => setClubEvents(data),
      (err) => console.error('Club events sub error:', err)
    );

    const unsubClubs = subscribeToClubs(
      (data) => setClubs(data),
      (err) => console.error('Clubs sub error:', err)
    );

    return () => {
      unsubActivities();
      unsubForms();
      unsubUsers();
      unsubSettings();
      unsubClubEvents();
      unsubClubs();
    };
  }, []);

  // If user is NOT logged in, show ONLY the Login Screen!
  if (!userProfile) {
    return <AdminLogin />;
  }

  const studentUsers = users.filter((u) => u.role === 'student');

  const handleSelectForm = (form: DynamicForm) => {
    setSelectedForm(form);
    setFormsView('details');
    setCurrentTab('forms');
  };

  const handleOpenCreateForm = (linkedAct?: Activity) => {
    setEditingForm(null);
    setFormLinkedActivity(linkedAct || null);
    setFormsView('create');
    setCurrentTab('forms');
  };

  const handleEditForm = (form: DynamicForm) => {
    setEditingForm(form);
    setFormLinkedActivity(activities.find((a) => a.id === form.activityId) || null);
    setFormsView('create');
    setCurrentTab('forms');
  };

  const handleFormSaved = (savedForm: DynamicForm) => {
    setSelectedForm(savedForm);
    setFormsView('details');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'forms') setFormsView('list');
        }}
        openChangePasswordModal={() => setIsPasswordModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Head Admin Dedicated Portal */}
        {currentTab === 'admin_portal' && isAdmin && (
          <HeadAdminPortal
            featureControls={featureControls}
            users={users}
            activities={activities}
            forms={forms}
            clubEvents={clubEvents}
            clubs={clubs}
            onOpenCreateClubEvent={() => setIsEventModalOpen(true)}
            onOpenCreateActivity={() => setCurrentTab('agenda')}
            onOpenCreateForm={() => handleOpenCreateForm()}
            onSelectForm={handleSelectForm}
          />
        )}

        {/* Shared Agenda & Calendar View */}
        {currentTab === 'agenda' && (
          <Agenda
            activities={activities}
            forms={forms}
            onSelectForm={handleSelectForm}
            onOpenCreateFormForActivity={(act) => handleOpenCreateForm(act)}
          />
        )}

        {/* Forms Sub-Views */}
        {currentTab === 'forms' && (
          <>
            {formsView === 'list' && (
              <FormsList
                forms={forms}
                activities={activities}
                onSelectForm={handleSelectForm}
                onOpenCreate={() => handleOpenCreateForm()}
                onEditForm={handleEditForm}
              />
            )}

            {formsView === 'create' && (
              <FormCreation
                activities={activities}
                initialForm={editingForm}
                linkedActivity={formLinkedActivity}
                onSaved={handleFormSaved}
                onCancel={() => setFormsView('list')}
              />
            )}

            {formsView === 'details' && selectedForm && (
              <FormDetails
                form={selectedForm}
                onBack={() => setFormsView('list')}
                onEdit={handleEditForm}
              />
            )}
          </>
        )}
      </main>

      {/* Club Event Agenda Modal (8 Participants Selection, PPT/Video/PDF Uploads) */}
      <EventAgendaModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        clubs={clubs}
        allStudents={studentUsers}
        allEvents={clubEvents}
        onEventCreated={() => {
          setIsEventModalOpen(false);
        }}
      />

      {/* Password & Profile Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
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
