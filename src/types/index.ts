export type UserRole = 'admin' | 'faculty' | 'student';

// Roll number student positions: Secretary, Executive, or normal Member
export type StudentPosition = 'Secretary' | 'Executive' | 'Member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  rollNumber?: string;       // e.g. "25MBA001" to "25MBA175"
  facultyId?: string;        // e.g. "FAC001"
  yearOfStudying?: string;   // e.g. "1st Year (2025-2027)", "2nd Year (2024-2026)"
  position?: string;         // 'Secretary' | 'Executive' | 'Member' | 'HOD' | 'Professor' | 'Head Admin'
  club?: string;             // Assigned club (e.g. 'NISM', 'NIPM', 'Ad Club', 'Student Activity')
  department?: string;
  batch?: string;
  phone?: string;
  status: 'active' | 'inactive';
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClubCategory {
  id: string;
  name: string;
  description?: string;
  isCustom?: boolean;
  createdBy?: string;
}

export interface EventFileAttachment {
  id: string;
  name: string;
  type: 'ppt' | 'video' | 'pdf' | 'other';
  size: number;
  dataUrl: string;
  uploadedAt: string;
  uploadedByName: string;
  uploadedByRoll: string;
}

export interface EventParticipant {
  rollNumber: string;
  name: string;
  selectedByExecutiveRoll?: string;
}

export type EventApprovalStatus = 
  | 'pending_secretary_approval'
  | 'approved'
  | 'rejected'
  | 'needs_revision';

export interface ClubEventAgenda {
  id: string;
  title: string;
  club: string; // 'NISM' | 'NIPM' | 'Ad Club' | 'Student Activity' | custom
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
  
  // Incharge details
  eventInchargeName: string;
  eventInchargeRoll: string;
  
  // Executive who selected participants
  createdExecutiveRoll: string;
  createdExecutiveName: string;
  
  // 8 Participants selected strictly by Executive
  participants: EventParticipant[];
  
  // Uploaded files: PPT (.ppt, .pptx), Video, PDF
  files: EventFileAttachment[];
  
  // Secretary Approval Workflow
  status: EventApprovalStatus;
  secretaryApprovalNotes?: string;
  reviewedBySecretaryRoll?: string;
  reviewedBySecretaryName?: string;
  reviewedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface FeatureAccessControls {
  id?: string;
  studentCanRSVP: boolean;
  studentCanSubmitForms: boolean;
  studentCanViewMaterials: boolean;
  studentLeadersCanCreateEvents: boolean;
  facultyCanCreateActivities: boolean;
  facultyCanCreateForms: boolean;
  facultyCanApproveSubmissions: boolean;
  allowStudentSelfRegistration: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
  updatedBy: string;
}

export type ActivityCategory = 
  | 'workshop'
  | 'seminar'
  | 'guest_lecture'
  | 'competition'
  | 'club_event'
  | 'placement'
  | 'industrial_visit'
  | 'academic';

export type ActivityStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  speaker?: string;
  organizerId: string;
  organizerName: string;
  maxParticipants?: number;
  registeredCount: number;
  status: ActivityStatus;
  materialsUrl?: string;
  linkedFormId?: string;
  club?: string;
  targetYear?: string;
  targetPosition?: string;
  createdAt: string;
  updatedAt: string;
}

export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'rating';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface DynamicForm {
  id: string;
  title: string;
  description: string;
  activityId?: string;
  activityTitle?: string;
  createdBy: string;
  createdByName: string;
  deadline?: string;
  isPublished: boolean;
  allowMultipleSubmissions: boolean;
  fields: FormField[];
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted';

export interface FormSubmission {
  id: string;
  formId: string;
  activityId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRollNumber?: string;
  userPosition?: string;
  responses: Record<string, any>;
  status: SubmissionStatus;
  feedback?: string;
  submittedAt: string;
  updatedAt: string;
}
