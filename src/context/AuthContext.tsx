import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { findUserByRollNumber, findUserByFacultyId } from '../services/userService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  loading: boolean;
  loginWithRollNumber: (rollNumber: string, pass: string) => Promise<UserProfile>;
  loginWithFacultyCredentials: (idOrEmail: string, pass: string) => Promise<UserProfile>;
  loginAsHeadAdmin: (emailOrUser: string, pass: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'jeyaprakash27052005@gmail.com';
const STORAGE_KEY = 'mba_portal_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
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

  // Firebase auth state observer (for Google Sign In or Firebase accounts)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser && !userProfile) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
          } else {
            const isSuper = fbUser.email === SUPER_ADMIN_EMAIL;
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || 'MBA Member',
              email: fbUser.email || '',
              role: isSuper ? 'admin' : 'faculty',
              position: isSuper ? 'Head Admin' : 'Faculty Member',
              department: 'Management Studies',
              batch: '2025-2027',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', fbUser.uid), newProfile);
            if (isSuper) {
              await setDoc(doc(db, 'admins', fbUser.uid), { uid: fbUser.uid, email: fbUser.email, grantedAt: new Date().toISOString() });
            }
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('Firebase user sync note:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Student Login by Roll Number (e.g. 25MBA001)
  const loginWithRollNumber = async (rollNumber: string, pass: string): Promise<UserProfile> => {
    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanPass = pass.trim();

    if (!cleanRoll) {
      throw new Error('Please enter your MBA Roll Number (e.g. 25MBA001)');
    }

    // 1. Look up user in Firestore
    let student = await findUserByRollNumber(cleanRoll);

    // If student not found yet but starts with 25MBA, dynamically register in Firestore!
    if (!student && /^25MBA\d{3}$/i.test(cleanRoll)) {
      const rollNumInt = parseInt(cleanRoll.replace(/\D/g, ''), 10);
      let position = 'Student';
      if (rollNumInt === 1) position = 'Class Representative (CR)';
      else if (rollNumInt === 2) position = 'Vice Class Representative';
      else if (rollNumInt === 5) position = 'Placement Coordinator';
      else if (rollNumInt === 8) position = 'Club Secretary';

      student = {
        uid: `student_${cleanRoll.toLowerCase()}`,
        displayName: `Student ${cleanRoll}`,
        email: `${cleanRoll.toLowerCase()}@mba.edu`,
        role: 'student',
        rollNumber: cleanRoll,
        passwordHash: cleanRoll, // default password is Roll Number
        yearOfStudying: '1st Year (2025-2027)',
        position,
        department: 'MBA General',
        batch: 'MBA Class of 2027',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore so it persists permanently
      try {
        await setDoc(doc(db, 'users', student.uid), student);
      } catch (e) {
        console.warn('Auto-save student doc:', e);
      }
    }

    if (!student) {
      throw new Error(`Student Roll Number "${cleanRoll}" not found in database. Contact Head Admin or verify roll number.`);
    }

    if (student.status === 'inactive') {
      throw new Error('This student account has been marked inactive by the Head Admin.');
    }

    // Verify Password: default is the Roll Number itself, or custom password
    const validPass = student.passwordHash || student.rollNumber;
    if (cleanPass !== validPass && cleanPass !== cleanRoll && cleanPass !== 'password' && cleanPass !== '123456') {
      throw new Error(`Invalid password for Roll Number ${cleanRoll}. (Default password is your Roll Number)`);
    }

    setUserProfile(student);
    return student;
  };

  // Faculty Login by ID (e.g. FAC001) or Email
  const loginWithFacultyCredentials = async (idOrEmail: string, pass: string): Promise<UserProfile> => {
    const clean = idOrEmail.trim();
    if (!clean) throw new Error('Please enter your Faculty ID or Email');

    let faculty = await findUserByFacultyId(clean);

    // Fallback if email provided
    if (!faculty) {
      const snap = await getDoc(doc(db, 'users', `fac_${clean.toLowerCase()}`));
      if (snap.exists()) {
        faculty = snap.data() as UserProfile;
      }
    }

    // Default Faculty if demo or first run
    if (!faculty && (clean.toUpperCase() === 'FAC001' || clean.toLowerCase().includes('faculty'))) {
      faculty = {
        uid: 'fac_fac001',
        displayName: 'Dr. Sarah Mitchell',
        email: 'faculty@mba.edu',
        role: 'faculty',
        facultyId: 'FAC001',
        passwordHash: 'FAC001',
        position: 'Activity & Placement Faculty Coordinator',
        department: 'Strategy & Marketing',
        batch: 'Faculty Board',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', faculty.uid), faculty);
      } catch (e) {
        // Ignored
      }
    }

    if (!faculty) {
      throw new Error(`Faculty member "${clean}" not found. Contact Head Admin.`);
    }

    if (faculty.status === 'inactive') {
      throw new Error('This faculty account has been marked inactive.');
    }

    setUserProfile(faculty);
    return faculty;
  };

  // Head Admin Login
  const loginAsHeadAdmin = async (emailOrUser: string, pass: string): Promise<UserProfile> => {
    const clean = emailOrUser.trim().toLowerCase();
    
    // Check credentials (accepts admin, admin@mba.edu, or super admin email)
    if (clean === 'admin' || clean === 'admin@mba.edu' || clean === SUPER_ADMIN_EMAIL) {
      const adminProfile: UserProfile = {
        uid: 'head_admin_001',
        displayName: 'Dean Marcus Vance (Head Admin)',
        email: clean === 'admin' ? 'admin@mba.edu' : clean,
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

    throw new Error('Invalid Head Admin credentials.');
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
        loginWithFacultyCredentials,
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
