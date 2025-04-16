import React from 'react';
import { TimeSlot } from '../types/Worker';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  timeSlots: TimeSlot[];
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ isOpen, onClose, date, timeSlots }) => {
  const calculateWorkingHours = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = differenceInHours(end, start);
    const minutes = differenceInMinutes(end, start) % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
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
                  <div className="calendar-details-slot-info">
                    <h4>{slot.workerName}</h4>
                    <p className="position">{slot.position}</p>
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
    </div>
  );
};

export default DayDetailsModal; 