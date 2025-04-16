import React, { useEffect, useState } from 'react';
import { Worker, TimeSlot } from '../types/Worker';
import { scheduleService } from '../services/scheduleService';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

interface ViewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
}

const ViewScheduleModal: React.FC<ViewScheduleModalProps> = ({ isOpen, onClose, worker }) => {
  const [schedules, setSchedules] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const today = startOfDay(new Date());
        const nextWeek = endOfDay(addDays(today, 7));
        const schedulesData = await scheduleService.getSchedules(today, nextWeek);
        setSchedules(schedulesData.filter(schedule => schedule.workerId === worker.id));
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSchedules();
    }
  }, [isOpen, worker.id]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{worker.name}'s Schedule</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <p className="text-center">No upcoming schedules found.</p>
          ) : (
            <div className="schedule-overview">
              {schedules.map(schedule => (
                <div key={schedule.id} className="schedule-overview-item">
                  <div className="schedule-overview-date">
                    {format(new Date(schedule.startTime), 'EEE, MMM d')}
                  </div>
                  <div className="schedule-overview-time">
                    {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="button button-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewScheduleModal; 