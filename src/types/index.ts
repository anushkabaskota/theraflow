import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'patient' | 'therapist' | 'trainee' | 'supervisor';
export type SupervisionStatus = 'unsupervised' | 'pending' | 'approved' | 'revoked';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole | null;
  // Trainee fields
  supervisionStatus?: SupervisionStatus;
  supervisorId?: string;
  degree?: string;
  institution?: string;
  graduationYear?: number;
  bio?: string;
  areasOfInterest?: string[];
  // Supervisor fields
  licenseNumber?: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'cancelled';
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
