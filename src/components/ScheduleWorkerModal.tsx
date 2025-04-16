import React, { useState } from 'react';
import { Worker } from '../types/Worker';
import { scheduleService } from '../services/scheduleService';
import { addDays, format, isAfter, isBefore, eachDayOfInterval } from 'date-fns';

interface ScheduleWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  onScheduleUpdated: () => void;
}

const ScheduleWorkerModal: React.FC<ScheduleWorkerModalProps> = ({ isOpen, onClose, worker, onScheduleUpdated }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate date range
      if (isAfter(start, end)) {
        alert('End date must be after start date');
        return;
      }

      // Get all days in the range
      const days = eachDayOfInterval({ start, end });
      const schedules = [];

      // Create schedules for each day
      for (const day of days) {
        const scheduleData = {
          workerId: worker.id,
          workerName: worker.name,
          startTime: `${format(day, 'yyyy-MM-dd')}T${startTime}:00`,
          endTime: `${format(day, 'yyyy-MM-dd')}T${endTime}:00`,
          position: worker.position,
          date: day,
          notes
        };
        schedules.push(scheduleData);
      }

      // Add all schedules
      await Promise.all(schedules.map(schedule => scheduleService.addSchedule(schedule)));
      
      onScheduleUpdated();
      onClose();
      alert(`Schedule updated successfully from ${format(start, 'MMM d')} to ${format(end, 'MMM d')}!`);
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
            <label htmlFor="startDate" className="form-label">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate" className="form-label">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
              min={startDate || new Date().toISOString().split('T')[0]}
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