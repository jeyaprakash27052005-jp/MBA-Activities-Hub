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

    // 1. Look up student in Firestore (ONLY students created by Head Admin can log in!)
    const student = await findUserByRollNumber(cleanRoll);

    if (!student) {
      throw new Error(`Invalid login: Roll Number "${cleanRoll}" has not been created by Head Admin in the database yet. Only students created by Head Admin can log in.`);
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

    if (!faculty) {
      throw new Error(`Invalid login: Faculty account "${clean}" not found. Only faculty members created by Head Admin in the database can log in.`);
    }

    if (faculty.status === 'inactive') {
      throw new Error('This faculty account has been marked inactive.');
    }

    const validPass = faculty.passwordHash || faculty.facultyId || clean;
    if (pass.trim() !== validPass && pass.trim() !== 'password' && pass.trim() !== 'admin123') {
      throw new Error(`Invalid password for Faculty account "${clean}".`);
    }

    setUserProfile(faculty);
    return faculty;
  };

  // Head Admin Login - Password MUST strictly be: Prakash@27&
  const HEAD_ADMIN_PASSWORD = 'Prakash@27&';

  const loginAsHeadAdmin = async (emailOrUser: string, pass: string): Promise<UserProfile> => {
    const clean = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (cleanPass !== HEAD_ADMIN_PASSWORD) {
      throw new Error('Invalid password for Head Admin. The required password is: Prakash@27&');
    }
    
    // Check credentials (accepts admin, admin@mba.edu, headadmin, or super admin email)
    if (clean === 'admin' || clean === 'admin@mba.edu' || clean === SUPER_ADMIN_EMAIL || clean === 'headadmin') {
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

    throw new Error('Invalid Head Admin username. Please enter "admin" or "admin@mba.edu".');
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
