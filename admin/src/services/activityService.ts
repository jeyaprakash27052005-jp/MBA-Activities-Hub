import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Activity } from '../types';

const ACTIVITIES_COLLECTION = 'activities';

export const subscribeToActivities = (
  onData: (activities: Activity[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, ACTIVITIES_COLLECTION), orderBy('date', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const activities: Activity[] = [];
      snapshot.forEach((docSnap) => {
        activities.push(docSnap.data() as Activity);
      });
      onData(activities);
    },
    (error) => {
      console.warn('Activities listener notice:', error);
      if (onError) onError(error);
    }
  );
};

export const createActivity = async (
  activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt' | 'registeredCount'> & { id?: string }
): Promise<Activity> => {
  const id = activity.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newActivity: Activity = {
    ...activity,
    id,
    registeredCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, ACTIVITIES_COLLECTION, id), newActivity);
    return newActivity;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ACTIVITIES_COLLECTION}/${id}`);
  }
};

export const updateActivity = async (id: string, updates: Partial<Activity>): Promise<void> => {
  try {
    await updateDoc(doc(db, ACTIVITIES_COLLECTION, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ACTIVITIES_COLLECTION}/${id}`);
  }
};

export const deleteActivity = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ACTIVITIES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ACTIVITIES_COLLECTION}/${id}`);
  }
};

export const incrementActivityRegistration = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, ACTIVITIES_COLLECTION, id), {
      registeredCount: increment(1),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ACTIVITIES_COLLECTION}/${id}`);
  }
};
