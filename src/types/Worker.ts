export interface Worker {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  tierId: string;
  tier?: string;
  availability: {
    [day: string]: {
      start: string;
      end: string;
    }[];
  };
}

export interface TimeSlot {
  id: string;
  workerId: string;
  workerName: string;
  startTime: string;
  endTime: string;
  position: string;
  date: Date;
  tierId?: string;
  tierColor?: string;
  hourlyRate?: number;
  durationInHours?: number;
  notes?: string;
} 