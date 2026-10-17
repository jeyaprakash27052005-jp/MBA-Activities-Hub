import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { findUserByFacultyId } from '../services/userService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  loading: boolean;
  loginWithFacultyCredentials: (idOrEmail: string, pass: string) => Promise<UserProfile>;
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
        if (parsed && parsed.role === 'faculty') return parsed;
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

  // Faculty Login by ID (e.g. FAC001) or Email - ONLY accounts created by Head Admin can log in!
  const loginWithFacultyCredentials = async (idOrEmail: string, pass: string): Promise<UserProfile> => {
    const clean = idOrEmail.trim();
    if (!clean) throw new Error('Please enter your Faculty ID or Email');

    let faculty = await findUserByFacultyId(clean);

    // Fallback if ID stored in document key fac_<id>
    if (!faculty) {
      const snap = await getDoc(doc(db, 'users', `fac_${clean.toLowerCase()}`));
      if (snap.exists()) {
        faculty = snap.data() as UserProfile;
      }
    }

    if (!faculty || faculty.role !== 'faculty') {
      throw new Error('Invalid login: this Faculty account has not been created by the Head Admin.');
    }

    if (faculty.status === 'inactive') {
      throw new Error('Invalid login: this account has been deactivated by the Head Admin.');
    }

    const validPass = faculty.passwordHash || faculty.facultyId;
    if (!validPass || pass.trim() !== validPass) {
      throw new Error('Invalid login: incorrect Faculty ID or password.');
    }

    setUserProfile(faculty);
    return faculty;
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
    const stamp = new Date().toISOString();
    setUserProfile((prev) => (prev ? { ...prev, ...updates, updatedAt: stamp } : prev));
    try {
      // Write ONLY the changed fields. Writing the whole local copy would overwrite
      // values changed elsewhere (e.g. a position assigned by faculty) with stale data.
      await setDoc(doc(db, 'users', userProfile.uid), { ...updates, updatedAt: stamp }, { merge: true });
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
        loginWithFacultyCredentials,
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
