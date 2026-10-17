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
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

const USERS_COLLECTION = 'users';

export const subscribeToUsers = (
  onData: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as UserProfile);
      });
      onData(users);
    },
    (error) => {
      console.warn('Users listener notice:', error);
      if (onError) onError(error);
    }
  );
};

export const isValidStudentRollNumber = (rollNo: string): boolean => {
  if (!rollNo) return false;
  const clean = rollNo.trim().toUpperCase();
  const match = clean.match(/^25MBA(\d{3})$/);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= 1 && num <= 175;
};

export const findUserByRollNumber = async (rollNo: string): Promise<UserProfile | null> => {
  const cleanRoll = rollNo.trim().toUpperCase();
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('rollNumber', '==', cleanRoll)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, USERS_COLLECTION);
  }
};

export const findUserByFacultyId = async (facId: string): Promise<UserProfile | null> => {
  const cleanId = facId.trim().toUpperCase();
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('facultyId', '==', cleanId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, USERS_COLLECTION);
  }
};

export const createSystemUser = async (user: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> => {
  const now = new Date().toISOString();
  const newUser: UserProfile = {
    ...user,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, user.uid), newUser);
    if (user.role === 'admin') {
      await setDoc(doc(db, 'admins', user.uid), { uid: user.uid, email: user.email, grantedAt: now });
    }
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${USERS_COLLECTION}/${user.uid}`);
  }
};

export const updateSystemUser = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    if (updates.role === 'admin') {
      await setDoc(doc(db, 'admins', uid), { uid, grantedAt: new Date().toISOString() });
    } else if (updates.role) {
      try {
        await deleteDoc(doc(db, 'admins', uid));
      } catch (e) {
        // Ignored
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
  }
};

export const deleteSystemUser = async (uid: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
    try {
      await deleteDoc(doc(db, 'admins', uid));
    } catch (e) {
      // Ignored
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COLLECTION}/${uid}`);
  }
};

// Generate Full Student Cohort 25MBA001 to 25MBA175
export const generateStudentCohort = async (
  prefix: string = '25MBA',
  start: number = 1,
  end: number = 175,
  yearOfStudying: string = '1st Year (2025-2027)'
): Promise<number> => {
  let createdCount = 0;
  const now = new Date().toISOString();

  // Positions assigned: Secretary, Executive, or Member
  const clubsList = ['NISM', 'NIPM', 'Ad Club', 'Student Activity'];

  // Write in batches of 25 (Firestore batch limit safe)
  for (let i = start; i <= end; i += 25) {
    const batch = writeBatch(db);
    const chunkEnd = Math.min(i + 24, end);

    for (let j = i; j <= chunkEnd; j++) {
      const rollNumStr = String(j).padStart(3, '0');
      const rollNumber = `${prefix}${rollNumStr}`;
      const uid = `student_${rollNumber.toLowerCase()}`;
      const name = sampleNames[(j - 1) % sampleNames.length] + (j > sampleNames.length ? ` (${j})` : '');
      
      let position: 'Secretary' | 'Executive' | 'Member' = 'Member';
      let club = clubsList[(j - 1) % clubsList.length];

      if (j === 1) {
        position = 'Secretary';
        club = 'NISM';
      } else if (j === 2) {
        position = 'Secretary';
        club = 'NIPM';
      } else if (j === 3) {
        position = 'Secretary';
        club = 'Ad Club';
      } else if (j === 4) {
        position = 'Secretary';
        club = 'Student Activity';
      } else if (j >= 5 && j <= 16) {
        position = 'Executive';
      } else {
        position = 'Member';
      }

      const userDocRef = doc(db, USERS_COLLECTION, uid);
      const studentProfile: UserProfile = {
        uid,
        displayName: name,
        email: `${rollNumber.toLowerCase()}@mba.edu`,
        role: 'student',
        rollNumber,
        passwordHash: rollNumber, // Default password is the Roll Number!
        yearOfStudying,
        position,
        club,
        department: 'MBA General',
        batch: 'MBA Class of 2027',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      batch.set(userDocRef, studentProfile, { merge: true });
      createdCount++;
    }

    await batch.commit();
  }

  return createdCount;
};

// Import from Excel rows
export const importUsersFromExcelRows = async (rows: any[]): Promise<{ added: number; errors: string[] }> => {
  let added = 0;
  const errors: string[] = [];
  const now = new Date().toISOString();

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    
    // Normalize keys (trim and case-insensitive check)
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach(k => {
      normalized[k.trim().toLowerCase()] = row[k];
    });

    // Check if student row: "Name Of student", "Roll Number", "Year of studing", "position"
    const studentName = normalized['name of student'] || normalized['name'] || normalized['student name'];
    const rollNo = normalized['roll number'] || normalized['roll no'] || normalized['rollnumber'];
    const yearOfStudying = normalized['year of studing'] || normalized['year of studying'] || normalized['year'];
    let position = normalized['position'] || normalized['role'] || 'Member';

    // Check if faculty row: "Name Of Faculty", "Faculty ID", "Department", "position"
    const facultyName = normalized['name of faculty'] || normalized['faculty name'];
    const facultyId = normalized['faculty id'] || normalized['fac id'] || normalized['facultyid'];
    const department = normalized['department'] || normalized['dept'];

    if (rollNo) {
      // Student import
      const cleanRoll = String(rollNo).trim().toUpperCase();
      
      // Strict validation: must be 25MBA001 to 25MBA175
      if (!isValidStudentRollNumber(cleanRoll)) {
        errors.push(`Row ${idx + 1} rejected: Roll number "${cleanRoll}" is invalid. Only 25MBA001 to 25MBA175 are permitted.`);
        continue;
      }

      // Map positions to Secretary, Executive, Member
      const posLower = String(position).trim().toLowerCase();
      let normalizedPos = 'Member';
      if (posLower.includes('secretary')) normalizedPos = 'Secretary';
      else if (posLower.includes('executive')) normalizedPos = 'Executive';
      else normalizedPos = 'Member';

      const name = studentName ? String(studentName).trim() : `Student ${cleanRoll}`;
      const uid = `student_${cleanRoll.toLowerCase()}`;

      try {
        await setDoc(doc(db, USERS_COLLECTION, uid), {
          uid,
          displayName: name,
          email: `${cleanRoll.toLowerCase()}@mba.edu`,
          role: 'student',
          rollNumber: cleanRoll,
          passwordHash: cleanRoll, // default password is Roll Number
          yearOfStudying: yearOfStudying ? String(yearOfStudying).trim() : 'MBA 1st Year',
          position: normalizedPos,
          department: 'MBA General',
          batch: 'MBA 2025-2027',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }, { merge: true });
        added++;
      } catch (err: any) {
        errors.push(`Row ${idx + 1} (${cleanRoll}): ${err.message}`);
      }
    } else if (facultyId || facultyName) {
      // Faculty import
      const cleanFacId = facultyId ? String(facultyId).trim().toUpperCase() : `FAC_${idx + 1}`;
      const name = facultyName ? String(facultyName).trim() : `Faculty Member`;
      const uid = `fac_${cleanFacId.toLowerCase()}`;

      try {
        await setDoc(doc(db, USERS_COLLECTION, uid), {
          uid,
          displayName: name,
          email: `${cleanFacId.toLowerCase()}@mba.edu`,
          role: 'faculty',
          facultyId: cleanFacId,
          passwordHash: cleanFacId,
          position: position ? String(position).trim() : 'Professor',
          department: department ? String(department).trim() : 'Management Studies',
          batch: 'Faculty Board',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }, { merge: true });
        added++;
      } catch (err: any) {
        errors.push(`Row ${idx + 1} (${cleanFacId}): ${err.message}`);
      }
    }
  }

  return { added, errors };
};
