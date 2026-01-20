import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';
import type { Appointment, UserProfile } from '@/types';

export { type UserProfile, type Appointment };

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  } else {
    return null;
  }
}

export async function createUserProfile(
  user: User,
  role: 'patient' | 'therapist'
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
  };
  await setDoc(userDocRef, userProfile);
  return userProfile;
}

export async function setUserRole(
  uid: string,
  role: 'patient' | 'therapist'
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  const userProfile = await getUserProfile(uid);

  if (userProfile) {
    await setDoc(userDocRef, { ...userProfile, role }, { merge: true });
  } else {
    // This case should ideally not happen if profile is created on signup
    const user = auth.currentUser;
    if(user) {
        await createUserProfile(user, role);
    }
  }
}

export async function createAppointment(appointment: Omit<Appointment, 'id'>): Promise<string> {
    const appointmentsCollectionRef = collection(db, 'appointments');
    const docRef = await addDoc(appointmentsCollectionRef, {
        ...appointment,
        startTime: Timestamp.fromDate(new Date(appointment.startTime)),
        endTime: Timestamp.fromDate(new Date(appointment.endTime)),
    });
    return docRef.id;
}


export async function getAppointmentsForUser(
  userId: string,
  role: 'patient' | 'therapist'
): Promise<Appointment[]> {
  const appointmentsCollectionRef = collection(db, 'appointments');
  const roleField = role === 'patient' ? 'patientId' : 'therapistId';
  
  const q = query(appointmentsCollectionRef, where(roleField, '==', userId));
  const querySnapshot = await getDocs(q);
  
  const appointments: Appointment[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    appointments.push({
      id: doc.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: (data.endTime as Timestamp).toDate(),
    } as Appointment);
  });
  
  return appointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
