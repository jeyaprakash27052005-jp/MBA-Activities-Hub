import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { findUserByRollNumber } from '../services/userService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  loading: boolean;
  loginWithRollNumber: (rollNumber: string, pass: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  syncProfile: (profile: UserProfile) => void;
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
        if (parsed && parsed.role === 'student') return parsed;
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

  // Student Login by Roll Number (25MBA001 to 25MBA175 created by Head Admin)
  const loginWithRollNumber = async (rollNumber: string, pass: string): Promise<UserProfile> => {
    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanPass = pass.trim();

    if (!cleanRoll) {
      throw new Error('Please enter your MBA Roll Number (e.g. 25MBA001)');
    }

    // Check valid range: 25MBA001 to 25MBA175
    const match = cleanRoll.match(/^25MBA(\d{3})$/);
    if (!match) {
      throw new Error('Invalid login: Roll Number must start with 25MBA followed by 3 digits (e.g. 25MBA001 to 25MBA175).');
    }
    const rollInt = parseInt(match[1], 10);
    if (rollInt < 1 || rollInt > 175) {
      throw new Error(`Invalid login: Roll Number ${cleanRoll} is outside permitted range (25MBA001 to 25MBA175).`);
    }

    // Look up student in Firestore (ONLY students created by Head Admin can log in!)
    const student = await findUserByRollNumber(cleanRoll);

    if (!student || student.role !== 'student') {
      throw new Error('Invalid login: this Roll Number has not been created by the Head Admin.');
    }

    if (student.status === 'inactive') {
      throw new Error('Invalid login: this account has been deactivated by the Head Admin.');
    }

    // Password is whatever the Head Admin set (defaults to the Roll Number at creation time)
    const validPass = student.passwordHash || student.rollNumber;
    if (!validPass || cleanPass !== validPass) {
      throw new Error('Invalid login: incorrect Roll Number or password.');
    }

    setUserProfile(student);
    return student;
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
        loginWithRollNumber,
        signOut,
        syncProfile: (p: UserProfile) => setUserProfile(p),
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
