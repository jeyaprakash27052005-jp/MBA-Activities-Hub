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
import { BatchConfig, UserProfile, UserRole } from '../types';

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

export const DEFAULT_BATCHES: BatchConfig[] = [
  { prefix: '25MBA', start: 1, end: 175, yearOfStudying: '1st Year (2025-2027)' },
];

const BATCHES_DOC = doc(db, 'settings', 'batches');

const withDefaults = (list: BatchConfig[] | undefined): BatchConfig[] => {
  const out = [...(list || [])];
  DEFAULT_BATCHES.forEach((d) => { if (!out.some((b) => b.prefix === d.prefix)) out.unshift(d); });
  return out;
};

export const subscribeToBatches = (onData: (batches: BatchConfig[]) => void) =>
  onSnapshot(
    BATCHES_DOC,
    (snap) => onData(withDefaults(snap.exists() ? (snap.data() as { list: BatchConfig[] }).list : [])),
    () => onData(DEFAULT_BATCHES)
  );

export const getBatches = async (): Promise<BatchConfig[]> => {
  try {
    const snap = await getDoc(BATCHES_DOC);
    return withDefaults(snap.exists() ? (snap.data() as { list: BatchConfig[] }).list : []);
  } catch (e) {
    return DEFAULT_BATCHES;
  }
};

// A roll number is valid only if it falls inside a configured batch (25MBA001-175 by default)
export const isValidStudentRollNumber = (rollNo: string, batches: BatchConfig[] = DEFAULT_BATCHES): boolean => {
  if (!rollNo) return false;
  const m = rollNo.trim().toUpperCase().match(/^(\d{2}MBA)(\d{3})$/);
  if (!m) return false;
  const num = parseInt(m[2], 10);
  const batch = batches.find((b) => b.prefix === m[1]);
  return !!batch && num >= batch.start && num <= batch.end;
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

// Generate a student batch (e.g. 25MBA001-25MBA175). Existing students are left untouched.
// Everyone starts as a Member (no club); faculty / Head Admin assign Secretary / Executive later.
export const generateStudentCohort = async (
  prefix: string = '25MBA',
  start: number = 1,
  end: number = 175,
  yearOfStudying: string = '1st Year (2025-2027)'
): Promise<number> => {
  let createdCount = 0;
  const now = new Date().toISOString();

  const existingSnap = await getDocs(query(collection(db, USERS_COLLECTION), where('role', '==', 'student')));
  const existing = new Set<string>();
  existingSnap.forEach((d) => existing.add(String((d.data() as UserProfile).rollNumber || '').toUpperCase()));

  const rolls: number[] = [];
  for (let j = start; j <= end; j++) {
    if (!existing.has(`${prefix}${String(j).padStart(3, '0')}`)) rolls.push(j);
  }

  // Write in batches of 25 (Firestore batch limit safe)
  for (let i = 0; i < rolls.length; i += 25) {
    const batch = writeBatch(db);
    for (const j of rolls.slice(i, i + 25)) {
      const rollNumStr = String(j).padStart(3, '0');
      const rollNumber = `${prefix}${rollNumStr}`;
      const uid = `student_${rollNumber.toLowerCase()}`;
      const studentProfile: UserProfile = {
        uid,
        displayName: `MBA Student ${rollNumStr}`, // placeholder; the student enters their real name on first login
        email: `${rollNumber.toLowerCase()}@mba.edu`,
        role: 'student',
        rollNumber,
        passwordHash: rollNumber, // Default password is the Roll Number
        yearOfStudying,
        position: 'Member',
        club: '',
        department: 'MBA General',
        batch: `MBA Batch ${prefix}`,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(doc(db, USERS_COLLECTION, uid), studentProfile);
      createdCount++;
    }
    await batch.commit();
  }

  return createdCount;
};

// Register a NEW batch (next year's roll numbers) and create all its student IDs.
export const addNextBatch = async (
  prefix: string,
  start: number,
  end: number,
  yearOfStudying: string
): Promise<{ created: number; skipped: number }> => {
  const cleanPrefix = prefix.trim().toUpperCase();
  if (!/^\d{2}MBA$/.test(cleanPrefix)) {
    throw new Error('Batch code must be 2 digits followed by MBA, e.g. 26MBA.');
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > 999) {
    throw new Error('Enter a valid roll number range (From 1, To up to 999).');
  }
  if (!yearOfStudying.trim()) throw new Error('Enter the year of studying for this batch.');

  const list = await getBatches();
  const existing = list.find((b) => b.prefix === cleanPrefix);
  const cfg: BatchConfig = {
    prefix: cleanPrefix,
    start: existing ? Math.min(existing.start, start) : start,
    end: existing ? Math.max(existing.end, end) : end,
    yearOfStudying: yearOfStudying.trim(),
  };
  const next = existing ? list.map((b) => (b.prefix === cleanPrefix ? cfg : b)) : [...list, cfg];
  await setDoc(BATCHES_DOC, { list: next, updatedAt: new Date().toISOString() });

  const created = await generateStudentCohort(cleanPrefix, start, end, yearOfStudying.trim());
  return { created, skipped: end - start + 1 - created };
};

// Import from Excel rows
export const importUsersFromExcelRows = async (rows: any[]): Promise<{ added: number; errors: string[] }> => {
  let added = 0;
  const errors: string[] = [];
  const now = new Date().toISOString();
  const batches = await getBatches();

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
      if (!isValidStudentRollNumber(cleanRoll, batches)) {
        errors.push(`Row ${idx + 1} rejected: Roll number "${cleanRoll}" is invalid. It is not inside any configured batch.`);
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
