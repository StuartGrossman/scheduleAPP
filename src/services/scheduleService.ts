import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { TimeSlot } from '../types/Worker';

export const scheduleService = {
  // Get all schedules for a specific date range
  async getSchedules(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    const schedulesRef = collection(db, 'schedules');
    const q = query(
      schedulesRef,
      where('startTime', '>=', startDate.toISOString()),
      where('startTime', '<=', endDate.toISOString())
    );
    
    const querySnapshot = await getDocs(q);
    const schedules: TimeSlot[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      schedules.push({
        id: doc.id,
        workerId: data.workerId,
        workerName: data.workerName,
        startTime: data.startTime,
        endTime: data.endTime,
        position: data.position,
        date: new Date(data.startTime),
        tierId: data.tierId || undefined,
        durationInHours: data.durationInHours || undefined,
        notes: data.notes || undefined
      });
    });
    
    return schedules;
  },

  // Add a new schedule
  async addSchedule(schedule: Omit<TimeSlot, 'id'>): Promise<string> {
    const schedulesRef = collection(db, 'schedules');
    const docRef = await addDoc(schedulesRef, {
      ...schedule,
      startTime: new Date(schedule.startTime).toISOString(),
      endTime: new Date(schedule.endTime).toISOString(),
      tierId: schedule.tierId || null
    });
    return docRef.id;
  },

  // Update an existing schedule
  async updateSchedule(scheduleId: string, updates: Partial<TimeSlot>): Promise<void> {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    if (updates.startTime) {
      updates.startTime = new Date(updates.startTime).toISOString();
    }
    if (updates.endTime) {
      updates.endTime = new Date(updates.endTime).toISOString();
    }
    await updateDoc(scheduleRef, updates);
  },

  // Delete a schedule
  async deleteSchedule(scheduleId: string): Promise<void> {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    await deleteDoc(scheduleRef);
  }
}; 