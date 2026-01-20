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
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { User } from 'firebase/auth';
import type { Appointment, UserProfile, TherapistSchedule, TherapistScheduleFromDB } from '@/types';
import { generateSlots } from './schedule';
import { parseISO, startOfDay, endOfDay } from 'date-fns';

export { type UserProfile, type Appointment, type TherapistSchedule };

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


export async function getTherapistSchedule(therapistId: string): Promise<TherapistScheduleFromDB | null> {
    const scheduleDocRef = doc(db, 'therapists', therapistId, 'schedule', 'default');
    const scheduleDocSnap = await getDoc(scheduleDocRef);
    if (scheduleDocSnap.exists()) {
        return scheduleDocSnap.data() as TherapistScheduleFromDB;
    }
    return null;
}

export async function saveTherapistSchedule(therapistId: string, schedule: TherapistSchedule): Promise<void> {
    const scheduleDocRef = doc(db, 'therapists', therapistId, 'schedule', 'default');
    const scheduleToSave = {
        ...schedule,
        manualSlots: schedule.manualSlots?.map(slot => ({
            start: Timestamp.fromDate(slot.start),
            end: Timestamp.fromDate(slot.end),
        })) || [],
        updatedAt: serverTimestamp(),
    };
    await setDoc(scheduleDocRef, scheduleToSave, { merge: true });
}


export async function getAvailableSlots(
  therapistId: string,
  startDateStr: string,
  endDateStr: string
): Promise<Date[]> {
  const schedule = await getTherapistSchedule(therapistId);
  if (!schedule) {
    return [];
  }

  const startDate = startOfDay(parseISO(startDateStr));
  const endDate = endOfDay(parseISO(endDateStr));

  // 1. Generate slots based on rules
  const generated = generateSlots(schedule as TherapistSchedule, startDate, endDate);

  // 2. Add manual one-off slots that are within the date range
  const manual = (schedule.manualSlots || [])
    .map(slot => slot.start.toDate())
    .filter(slotDate => slotDate >= startDate && slotDate <= endDate);

  // 3. Get already booked appointments to filter out unavailable slots
  const appointmentsCollectionRef = collection(db, 'appointments');
  const q = query(
    appointmentsCollectionRef,
    where('therapistId', '==', therapistId),
    where('startTime', '>=', startDate),
    where('startTime', '<=', endDate)
  );
  const querySnapshot = await getDocs(q);
  const bookedStartTimes = new Set(
    querySnapshot.docs.map(doc => (doc.data().startTime as Timestamp).toMillis())
  );

  // 4. Combine, de-duplicate, and filter
  const allSlots = [...generated, ...manual];
  const uniqueSlots = Array.from(new Set(allSlots.map(d => d.getTime())))
                           .map(time => new Date(time));

  const availableSlots = uniqueSlots.filter(slot => !bookedStartTimes.has(slot.getTime()));
  
  return availableSlots.sort((a, b) => a.getTime() - b.getTime());
}
