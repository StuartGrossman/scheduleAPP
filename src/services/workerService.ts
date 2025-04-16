import { db } from '../firebase/config';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Worker } from '../types/Worker';

const workersCollection = collection(db, 'workers');

export const workerService = {
  async addWorker(worker: Worker) {
    try {
      const docRef = await addDoc(workersCollection, worker);
      return { ...worker, id: docRef.id };
    } catch (error) {
      console.error('Error adding worker:', error);
      throw error;
    }
  },

  async getWorkers() {
    try {
      const querySnapshot = await getDocs(workersCollection);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as Worker,
        id: doc.id
      }));
    } catch (error) {
      console.error('Error getting workers:', error);
      throw error;
    }
  },

  async updateWorker(id: string, workerData: Omit<Worker, 'id'>) {
    if (!id) throw new Error('Worker ID is required for update');
    try {
      const workerRef = doc(db, 'workers', id);
      await updateDoc(workerRef, workerData);
    } catch (error) {
      console.error('Error updating worker:', error);
      throw error;
    }
  },

  async deleteWorker(workerId: string) {
    try {
      await deleteDoc(doc(db, 'workers', workerId));
    } catch (error) {
      console.error('Error deleting worker:', error);
      throw error;
    }
  }
}; 