export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'patient' | 'therapist' | null;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  
}
