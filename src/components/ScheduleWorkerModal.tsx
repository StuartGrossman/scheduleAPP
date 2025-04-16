import React, { useState } from 'react';
import { Worker } from '../types/Worker';
import { scheduleService } from '../services/scheduleService';

interface ScheduleWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  onScheduleUpdated: () => void;
}

const ScheduleWorkerModal: React.FC<ScheduleWorkerModalProps> = ({ isOpen, onClose, worker, onScheduleUpdated }) => {
  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create a new schedule
      const scheduleData = {
        workerId: worker.id,
        workerName: worker.name,
        startTime: `${scheduleDate}T${startTime}:00`,
        endTime: `${scheduleDate}T${endTime}:00`,
        position: worker.position,
        date: new Date(scheduleDate),
        notes
      };

      await scheduleService.addSchedule(scheduleData);
      onScheduleUpdated();
      onClose();
      alert('Schedule updated successfully!');
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Schedule {worker.name}</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="scheduleDate" className="form-label">
              Date
            </label>
            <input
              id="scheduleDate"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startTime" className="form-label">
              Start Time
            </label>
            <input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime" className="form-label">
              End Time
            </label>
            <input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleWorkerModal; 