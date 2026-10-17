import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';


interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  loading: boolean;
  loginAsHeadAdmin: (emailOrUser: string, pass: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'mba_portal_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === 'admin') return parsed;
      }
    } catch (e) {
      // Ignored
    }
    return null; // Null by default so the user sees LOGIN screen first!
  });
  const [loading, setLoading] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [userProfile]);

  // Head Admin Login - Password MUST strictly be: Prakash@27&
  const HEAD_ADMIN_PASSWORD = 'Prakash@27&';

  const loginAsHeadAdmin = async (emailOrUser: string, pass: string): Promise<UserProfile> => {
    const clean = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    // The Head Admin password is the credential; any non-empty username is accepted with it.
    if (cleanPass !== HEAD_ADMIN_PASSWORD || !clean) {
      throw new Error('Invalid login: Head Admin username or password is incorrect.');
    }

    {
      const adminProfile: UserProfile = {
        uid: 'head_admin_001',
        displayName: 'Dean Marcus Vance (Head Admin)',
        email: clean.includes('@') ? clean : 'admin@mba.edu',
        role: 'admin',
        position: 'Head of MBA Program & Chief Administrator',
        department: 'Dean Office',
        batch: 'Executive Leadership',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', adminProfile.uid), adminProfile, { merge: true });
        await setDoc(doc(db, 'admins', adminProfile.uid), { uid: adminProfile.uid, email: adminProfile.email, grantedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('Admin save note:', e);
      }

      setUserProfile(adminProfile);
      return adminProfile;
    }

  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // Ignored
    }
    setUserProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates, updatedAt: new Date().toISOString() };
    setUserProfile(updated);
    try {
      await setDoc(doc(db, 'users', userProfile.uid), updated, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userProfile.uid}`);
    }
  };

  const activeRole: UserRole = userProfile?.role || 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: activeRole,
        isAdmin: activeRole === 'admin',
        isFaculty: activeRole === 'faculty',
        isStudent: activeRole === 'student',
        loading,
        loginAsHeadAdmin,
        signOut,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
