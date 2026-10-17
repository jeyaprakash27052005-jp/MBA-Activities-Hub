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

  // Positions pool to demonstrate position-wise features
  const specialPositions: Record<number, string> = {
    1: 'Class Representative (CR)',
    2: 'Vice Class Representative',
    5: 'Placement Student Coordinator',
    8: 'Consulting & Strategy Club Lead',
    12: 'Finance & FinTech Club Secretary',
    18: 'Marketing Club President',
    25: 'Cultural & Event Secretary',
    30: 'Alumni Relations Coordinator'
  };

  const sampleNames = [
    'Aarav Sharma', 'Aditi Verma', 'Akash Patel', 'Ananya Iyer', 'Arjun Nair', 
    'Bhavna Joshi', 'Chetan Rao', 'Deepika Reddy', 'Devendra Singh', 'Divya Menon', 
    'Gaurav Saxena', 'Harini Krishnan', 'Ishaan Malhotra', 'Kavita Deshmukh', 'Kiran Kumar', 
    'Manish Choudhury', 'Meera Bhatt', 'Naveen Rajan', 'Neha Kapoor', 'Nikhil Gupta',
    'Pooja Hegde', 'Pranav Mukherjee', 'Priya Nambiar', 'Rahul Mehra', 'Rhea Sen',
    'Rohan Kulkarni', 'Saanvi Trivedi', 'Sanjay Pillai', 'Shreya Agarwal', 'Siddharth Jain',
    'Sneha Varma', 'Tanvi Mathur', 'Tarun Sethi', 'Varun Anand', 'Vidya Swaminathan'
  ];

  // Write in batches of 50 (Firestore limit is 500 ops per batch)
  for (let i = start; i <= end; i += 25) {
    const batch = writeBatch(db);
    const chunkEnd = Math.min(i + 24, end);

    for (let j = i; j <= chunkEnd; j++) {
      const rollNumStr = String(j).padStart(3, '0');
      const rollNumber = `${prefix}${rollNumStr}`;
      const uid = `student_${rollNumber.toLowerCase()}`;
      const name = sampleNames[(j - 1) % sampleNames.length] + (j > sampleNames.length ? ` (${j})` : '');
      const position = specialPositions[j] || 'Student';

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
    const position = normalized['position'] || normalized['role'] || 'Student';

    // Check if faculty row: "Name Of Faculty", "Faculty ID", "Department", "position"
    const facultyName = normalized['name of faculty'] || normalized['faculty name'];
    const facultyId = normalized['faculty id'] || normalized['fac id'] || normalized['facultyid'];
    const department = normalized['department'] || normalized['dept'];

    if (rollNo) {
      // Student import
      const cleanRoll = String(rollNo).trim().toUpperCase();
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
          position: position ? String(position).trim() : 'Student',
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
