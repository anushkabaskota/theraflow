
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'trainee' | 'supervisor';
export type SupervisionStatus = 'unsupervised' | 'pending' | 'approved' | 'revoked';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole | null;
  // Profile fields
  age?: number;
  pronouns?: string;
  preferredSessionFormat?: 'online' | 'in-person';
  languagePreference?: string;
  languages?: string[];
  areasOfConcern?: string[];
  assignedTraineeId?: string;
  bio?: string;
  // Trainee fields
  supervisionStatus?: SupervisionStatus;
  supervisorId?: string;
  degree?: string;
  institution?: string;
  graduationYear?: number;
  areasOfInterest?: string[];
  sessionsCompleted?: number;
  // Supervisor fields
  licenseNumber?: string;
  yearsOfExperience?: number;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
};

export type TherapistSchedule = {
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  workingHours: {
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
  };
  sessionDurationMinutes: number;
  mandatoryBreakMinutes: number;
  lunchBreak: {
    enabled: boolean;
    start?: string; // "HH:MM"
    end?: string;   // "HH:MM"
  };
  manualSlots?: { start: Date; end: Date }[];
  updatedAt?: Timestamp;
};

export type TherapistScheduleFromDB = Omit<TherapistSchedule, 'manualSlots' | 'updatedAt'> & {
  manualSlots?: { start: Timestamp; end: Timestamp }[];
  updatedAt?: Timestamp;
};


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;

}

export type SupervisionRequest = {
  id: string;
  traineeId: string;
  supervisorId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionNotes = {
  id: string;
  appointmentId: string;
  traineeId: string;
  supervisorId?: string;
  transcription: string;
  detailedNotes: string;           // For trainee's reference
  supervisorSummary: string;       // Anonymized themes for supervisor
  sharedWithSupervisor: boolean;
  createdAt: Date;
  updatedAt: Date;
};

