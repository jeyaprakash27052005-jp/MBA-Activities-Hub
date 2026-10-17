import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  increment 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DynamicForm, FormSubmission, SubmissionStatus } from '../types';

const FORMS_COLLECTION = 'forms';

export const subscribeToForms = (
  onData: (forms: DynamicForm[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, FORMS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const forms: DynamicForm[] = [];
      snapshot.forEach((docSnap) => {
        forms.push(docSnap.data() as DynamicForm);
      });
      onData(forms);
    },
    (error) => {
      console.warn('Forms listener notice:', error);
      if (onError) onError(error);
    }
  );
};

export const getFormById = async (formId: string): Promise<DynamicForm | null> => {
  try {
    const snap = await getDoc(doc(db, FORMS_COLLECTION, formId));
    if (!snap.exists()) return null;
    return snap.data() as DynamicForm;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${FORMS_COLLECTION}/${formId}`);
  }
};

export const createForm = async (
  form: Omit<DynamicForm, 'id' | 'createdAt' | 'updatedAt' | 'submissionCount'> & { id?: string }
): Promise<DynamicForm> => {
  const id = form.id || `form_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newForm: DynamicForm = {
    ...form,
    id,
    submissionCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, FORMS_COLLECTION, id), newForm);
    return newForm;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${FORMS_COLLECTION}/${id}`);
  }
};

export const updateForm = async (id: string, updates: Partial<DynamicForm>): Promise<void> => {
  try {
    await updateDoc(doc(db, FORMS_COLLECTION, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FORMS_COLLECTION}/${id}`);
  }
};

export const deleteForm = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, FORMS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${FORMS_COLLECTION}/${id}`);
  }
};

// Submissions under forms/{formId}/submissions/{submissionId}
export const subscribeToSubmissions = (
  formId: string,
  onData: (submissions: FormSubmission[]) => void,
  onError?: (error: Error) => void
) => {
  const path = `${FORMS_COLLECTION}/${formId}/submissions`;
  const q = query(collection(db, path), orderBy('submittedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const subs: FormSubmission[] = [];
      snapshot.forEach((docSnap) => {
        subs.push(docSnap.data() as FormSubmission);
      });
      onData(subs);
    },
    (error) => {
      console.warn('Submissions listener notice:', error);
      if (onError) onError(error);
    }
  );
};

export const submitForm = async (
  formId: string,
  submission: Omit<FormSubmission, 'id' | 'submittedAt' | 'updatedAt'>
): Promise<FormSubmission> => {
  const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const subData: FormSubmission = {
    ...submission,
    id,
    formId,
    submittedAt: now,
    updatedAt: now,
  };

  const path = `${FORMS_COLLECTION}/${formId}/submissions/${id}`;
  try {
    await setDoc(doc(db, `${FORMS_COLLECTION}/${formId}/submissions`, id), subData);
    await updateDoc(doc(db, FORMS_COLLECTION, formId), {
      submissionCount: increment(1),
      updatedAt: now,
    });
    return subData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateSubmissionStatus = async (
  formId: string,
  submissionId: string,
  status: SubmissionStatus,
  feedback?: string
): Promise<void> => {
  const path = `${FORMS_COLLECTION}/${formId}/submissions/${submissionId}`;
  try {
    await updateDoc(doc(db, `${FORMS_COLLECTION}/${formId}/submissions`, submissionId), {
      status,
      ...(feedback ? { feedback } : {}),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
