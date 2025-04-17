import React, { useState } from 'react';
import { TimeSlot } from '../types/Worker';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { scheduleService } from '../services/scheduleService';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  timeSlots: TimeSlot[];
  onScheduleDeleted: () => void;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  date, 
  timeSlots,
  onScheduleDeleted 
}) => {
  const [scheduleToDelete, setScheduleToDelete] = useState<TimeSlot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const calculateWorkingHours = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  };

  const handleDeleteClick = (slot: TimeSlot) => {
    setScheduleToDelete(slot);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;
    
    setIsDeleting(true);
    try {
      await scheduleService.deleteSchedule(scheduleToDelete.id);
      onScheduleDeleted();
      setScheduleToDelete(null);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Schedule for {format(date, 'EEEE, MMMM d, yyyy')}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {timeSlots.length === 0 ? (
            <p className="text-center">No scheduled workers for this day</p>
          ) : (
            <div className="calendar-details-slots">
              {timeSlots.map(slot => (
                <div key={slot.id} className="calendar-details-slot">
                  <div className="calendar-details-slot-header">
                    <div className="calendar-details-slot-info">
                      <h4>{slot.workerName}</h4>
                      <p className="position">{slot.position}</p>
                    </div>
                    <button 
                      className="button button-danger button-small"
                      onClick={() => handleDeleteClick(slot)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="calendar-details-slot-time">
                    <div className="time-block">
                      <span className="time-label">Start:</span>
                      <span className="time-value">{format(new Date(slot.startTime), 'h:mm a')}</span>
                    </div>
                    <div className="time-block">
                      <span className="time-label">End:</span>
                      <span className="time-value">{format(new Date(slot.endTime), 'h:mm a')}</span>
                    </div>
                    <div className="time-block total-hours">
                      <span className="time-label">Total:</span>
                      <span className="time-value">{calculateWorkingHours(slot.startTime, slot.endTime)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {scheduleToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setScheduleToDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete {scheduleToDelete.workerName}'s schedule for{' '}
                {format(new Date(scheduleToDelete.startTime), 'h:mm a')} -{' '}
                {format(new Date(scheduleToDelete.endTime), 'h:mm a')}?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="button button-secondary"
                onClick={() => setScheduleToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayDetailsModal; 