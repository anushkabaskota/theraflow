
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
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { User } from 'firebase/auth';
import type { Appointment, UserProfile, TherapistSchedule, TherapistScheduleFromDB, UserRole, SupervisionRequest, SessionNotes } from '@/types';
import { generateSlots } from './schedule';
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export { type UserProfile, type Appointment, type TherapistSchedule, type SupervisionRequest, type SessionNotes };

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
      }));
    }
    throw e;
  }
}

export async function createUserProfile(
  user: User,
  role: UserRole
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: role,
  };

  if (role === 'trainee') {
    userProfile.supervisionStatus = 'unsupervised';
  }

  setDoc(userDocRef, userProfile)
    .catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: userProfile,
      }));
    });

  return userProfile;
}

export async function setUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  const userProfile = await getUserProfile(uid);

  if (userProfile) {
    const updatedProfile: UserProfile = { ...userProfile, role };
    if (role === 'trainee' && !userProfile.supervisionStatus) {
      updatedProfile.supervisionStatus = 'unsupervised';
    }
    setDoc(userDocRef, updatedProfile, { merge: true })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: updatedProfile,
        }));
      });
  } else {
    const user = auth.currentUser;
    if (user) {
      await createUserProfile(user, role);
    }
  }
}

export async function getTrainees(): Promise<UserProfile[]> {
  const usersCollectionRef = collection(db, 'users');
  const q = query(usersCollectionRef, where('role', '==', 'trainee'));
  try {
    const querySnapshot = await getDocs(q);
    const trainees: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      trainees.push(doc.data() as UserProfile);
    });
    return trainees;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list',
      }));
    }
    throw e;
  }
}

export async function createAppointment(appointment: Omit<Appointment, 'id'>): Promise<string> {
  const appointmentsCollectionRef = collection(db, 'appointments');
  const appointmentData = {
    ...appointment,
    startTime: Timestamp.fromDate(new Date(appointment.startTime)),
    endTime: Timestamp.fromDate(new Date(appointment.endTime)),
  };

  try {
    const docRef = await addDoc(appointmentsCollectionRef, appointmentData);
    return docRef.id;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'appointments',
        operation: 'create',
        requestResourceData: appointmentData,
      }));
    }
    throw e;
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: 'confirmed' | 'cancelled'): Promise<void> {
  const docRef = doc(db, 'appointments', appointmentId);
  try {
    await setDoc(docRef, { status }, { merge: true });
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `appointments/${appointmentId}`,
        operation: 'update',
        requestResourceData: { status },
      }));
    }
    throw e;
  }
}


export async function getAppointmentsForUser(
  userId: string,
  role: 'user' | 'trainee' | 'supervisor'
): Promise<Appointment[]> {
  const appointmentsCollectionRef = collection(db, 'appointments');
  const roleField = role === 'user' ? 'patientId' : 'therapistId';

  const q = query(appointmentsCollectionRef, where(roleField, '==', userId));
  try {
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
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'appointments',
        operation: 'list',
      }));
    }
    throw e;
  }
}

export function listenForAppointments(
  userId: string,
  role: 'user' | 'trainee' | 'supervisor',
  callback: (appointments: Appointment[]) => void
): () => void {
  const appointmentsCollectionRef = collection(db, 'appointments');

  let q;
  if (role === 'user') {
    q = query(appointmentsCollectionRef, where('patientId', '==', userId));
  } else {
    q = query(appointmentsCollectionRef, where('therapistId', '==', userId));
  }

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
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

    const sortedAppointments = appointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    callback(sortedAppointments);
  }, (e) => {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'appointments',
        operation: 'list',
      }));
    }
  });

  return unsubscribe;
}


export async function getTherapistSchedule(therapistId: string): Promise<TherapistScheduleFromDB | null> {
  const scheduleDocRef = doc(db, 'users', therapistId, 'schedule', 'default');
  try {
    const scheduleDocSnap = await getDoc(scheduleDocRef);
    if (scheduleDocSnap.exists()) {
      return scheduleDocSnap.data() as TherapistScheduleFromDB;
    }
    return null;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: scheduleDocRef.path,
        operation: 'get',
      }));
    }
    throw e;
  }
}

export async function saveTherapistSchedule(therapistId: string, schedule: TherapistSchedule): Promise<void> {
  const scheduleDocRef = doc(db, 'users', therapistId, 'schedule', 'default');
  const scheduleToSave = {
    ...schedule,
    manualSlots: schedule.manualSlots?.map(slot => ({
      start: Timestamp.fromDate(slot.start),
      end: Timestamp.fromDate(slot.end),
    })) || [],
    updatedAt: serverTimestamp(),
  };
  setDoc(scheduleDocRef, scheduleToSave, { merge: true })
    .catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: scheduleDocRef.path,
        operation: 'write',
        requestResourceData: scheduleToSave,
      }));
    });
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

  const generated = generateSlots(schedule as TherapistSchedule, startDate, endDate);

  const manual = (schedule.manualSlots || [])
    .map(slot => slot.start.toDate())
    .filter(slotDate => slotDate >= startDate && slotDate <= endDate);

  const appointmentsCollectionRef = collection(db, 'appointments');
  const q = query(
    appointmentsCollectionRef,
    where('therapistId', '==', therapistId),
    where('startTime', '>=', startDate),
    where('startTime', '<=', endDate)
  );

  try {
    const querySnapshot = await getDocs(q);
    const bookedStartTimes = new Set(
      querySnapshot.docs.map(doc => (doc.data().startTime as Timestamp).toMillis())
    );

    // Round to minute precision to avoid duplicates from millisecond differences
    const roundToMinute = (d: Date) => {
      const rounded = new Date(d);
      rounded.setSeconds(0, 0);
      return rounded;
    };

    const allSlots = [...generated, ...manual].map(roundToMinute);
    const uniqueSlots = Array.from(new Set(allSlots.map(d => d.getTime())))
      .map(time => new Date(time));

    const now = new Date();
    const availableSlots = uniqueSlots.filter(slot =>
      !bookedStartTimes.has(slot.getTime()) && slot.getTime() > now.getTime()
    );

    return availableSlots.sort((a, b) => a.getTime() - b.getTime());
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'appointments',
        operation: 'list',
      }));
    }
    throw e;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  setDoc(userDocRef, data, { merge: true })
    .catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
    });
}

// ========== Supervision / Mentorship Functions ==========

export async function getSupervisors(): Promise<UserProfile[]> {
  const usersCollectionRef = collection(db, 'users');
  const q = query(usersCollectionRef, where('role', '==', 'supervisor'));
  try {
    const querySnapshot = await getDocs(q);
    const supervisors: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      supervisors.push(doc.data() as UserProfile);
    });
    return supervisors;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list',
      }));
    }
    throw e;
  }
}

export async function createSupervisionRequest(
  traineeId: string,
  supervisorId: string,
  message: string
): Promise<string> {
  const requestsCollectionRef = collection(db, 'supervisionRequests');
  const requestData = {
    traineeId,
    supervisorId,
    message,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    const docRef = await addDoc(requestsCollectionRef, requestData);
    return docRef.id;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'supervisionRequests',
        operation: 'create',
        requestResourceData: requestData,
      }));
    }
    throw e;
  }
}

export function listenForSupervisionRequests(
  userId: string,
  role: 'trainee' | 'supervisor',
  callback: (requests: SupervisionRequest[]) => void
): () => void {
  const requestsCollectionRef = collection(db, 'supervisionRequests');
  const field = role === 'trainee' ? 'traineeId' : 'supervisorId';
  const q = query(
    requestsCollectionRef,
    where(field, '==', userId),
    where('status', '==', 'pending')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const requests: SupervisionRequest[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      requests.push({
        id: docSnap.id,
        traineeId: data.traineeId,
        supervisorId: data.supervisorId,
        status: data.status,
        message: data.message,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as SupervisionRequest);
    });
    callback(requests);
  }, (e) => {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'supervisionRequests',
        operation: 'list',
      }));
    }
  });

  return unsubscribe;
}

export async function updateSupervisionRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const docRef = doc(db, 'supervisionRequests', requestId);
  try {
    await setDoc(docRef, { status, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `supervisionRequests/${requestId}`,
        operation: 'update',
        requestResourceData: { status },
      }));
    }
    throw e;
  }
}

export async function approveTrainee(
  supervisorId: string,
  traineeId: string
): Promise<void> {
  const traineeDocRef = doc(db, 'users', traineeId);
  try {
    await setDoc(traineeDocRef, {
      supervisorId,
      supervisionStatus: 'approved',
    }, { merge: true });
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: traineeDocRef.path,
        operation: 'update',
      }));
    }
    throw e;
  }
}

export async function getTraineesForSupervisor(supervisorId: string): Promise<UserProfile[]> {
  const usersCollectionRef = collection(db, 'users');
  const q = query(
    usersCollectionRef,
    where('role', '==', 'trainee'),
    where('supervisorId', '==', supervisorId)
  );
  try {
    const querySnapshot = await getDocs(q);
    const trainees: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      trainees.push(docSnap.data() as UserProfile);
    });
    return trainees;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list',
      }));
    }
    throw e;
  }
}

// ========== Session Notes Functions ==========

export async function saveSessionNotes(notes: Omit<SessionNotes, 'id'>): Promise<string> {
  const notesCollectionRef = collection(db, 'sessionNotes');
  const notesData = {
    ...notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    const docRef = await addDoc(notesCollectionRef, notesData);
    return docRef.id;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'sessionNotes',
        operation: 'create',
      }));
    }
    throw e;
  }
}

export async function getSessionNotesForAppointment(appointmentId: string): Promise<SessionNotes | null> {
  const notesCollectionRef = collection(db, 'sessionNotes');
  const q = query(notesCollectionRef, where('appointmentId', '==', appointmentId));
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as SessionNotes;
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'sessionNotes',
        operation: 'list',
      }));
    }
    throw e;
  }
}

export async function getSessionNotesForSupervisor(supervisorId: string): Promise<SessionNotes[]> {
  const notesCollectionRef = collection(db, 'sessionNotes');
  const q = query(
    notesCollectionRef,
    where('supervisorId', '==', supervisorId),
    where('sharedWithSupervisor', '==', true)
  );
  try {
    const querySnapshot = await getDocs(q);
    const notes: SessionNotes[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notes.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as SessionNotes);
    });
    return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'sessionNotes',
        operation: 'list',
      }));
    }
    throw e;
  }
}

export async function shareNotesWithSupervisor(notesId: string, supervisorId: string): Promise<void> {
  const docRef = doc(db, 'sessionNotes', notesId);
  try {
    await setDoc(docRef, { sharedWithSupervisor: true, supervisorId, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `sessionNotes/${notesId}`,
        operation: 'update',
      }));
    }
    throw e;
  }
}

