import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FeatureAccessControls } from '../types';

const SETTINGS_DOC_PATH = 'settings/feature_controls';

export const DEFAULT_FEATURE_CONTROLS: FeatureAccessControls = {
  studentCanRSVP: true,
  studentCanSubmitForms: true,
  studentCanViewMaterials: true,
  studentLeadersCanCreateEvents: true,
  facultyCanCreateActivities: true,
  facultyCanCreateForms: true,
  facultyCanApproveSubmissions: true,
  allowStudentSelfRegistration: false,
  maintenanceMode: false,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Head Admin',
};

export const subscribeToFeatureControls = (
  onData: (controls: FeatureAccessControls) => void,
  onError?: (err: Error) => void
) => {
  const docRef = doc(db, 'settings', 'feature_controls');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as FeatureAccessControls);
      } else {
        // Initialize default if not exists
        setDoc(docRef, DEFAULT_FEATURE_CONTROLS).catch(console.error);
        onData(DEFAULT_FEATURE_CONTROLS);
      }
    },
    (err) => {
      console.warn('Feature controls listener error (using defaults):', err);
      onData(DEFAULT_FEATURE_CONTROLS);
      if (onError) onError(err);
    }
  );
};

export const updateFeatureControls = async (
  updates: Partial<FeatureAccessControls>,
  adminName: string = 'Head Admin'
): Promise<void> => {
  const docRef = doc(db, 'settings', 'feature_controls');
  try {
    await setDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, SETTINGS_DOC_PATH);
  }
};
