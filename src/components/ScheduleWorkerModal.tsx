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
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const start = new Date(startDate);
      const end = isMultiDay ? new Date(endDate) : start;

      // Validate date range for multi-day
      if (isMultiDay && isAfter(start, end)) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      // Validate time range
      const startTimeObj = new Date(`2000-01-01T${startTime}`);
      const endTimeObj = new Date(`2000-01-01T${endTime}`);
      
      // Check if end time is before start time
      if (startTimeObj >= endTimeObj) {
        setError('End time must be after start time');
        setIsSubmitting(false);
        return;
      }

      // Calculate duration in hours
      const durationInHours = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60 * 60);

      // Validate minimum duration (1 hour)
      if (durationInHours < 1) {
        setError('Minimum schedule duration is 1 hour');
        setIsSubmitting(false);
        return;
      }

      // Validate maximum duration (24 hours)
      if (durationInHours > 24) {
        setError('Schedule duration cannot exceed 24 hours');
        setIsSubmitting(false);
        return;
      }

      // Get all days in the range
      const days = isMultiDay ? eachDayOfInterval({ start, end }) : [start];
      const schedules = [];

      // Create schedules for each day
      for (const day of days) {
        const scheduleData = {
          workerId: worker.id,
          workerName: worker.name,
          tierId: worker.tierId,
          startTime: `${format(day, 'yyyy-MM-dd')}T${startTime}:00`,
          endTime: `${format(day, 'yyyy-MM-dd')}T${endTime}:00`,
          position: worker.position,
          date: day,
          notes,
          durationInHours
        };
        schedules.push(scheduleData);
      }

      // Add all schedules
      await Promise.all(schedules.map(schedule => scheduleService.addSchedule(schedule)));
      
      setShowSuccess(true);
      setTimeout(() => {
        onScheduleUpdated();
        onClose();
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError('Failed to update schedule. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Schedule {worker.name}</h2>
          <button onClick={onClose} className="modal-close" disabled={isSubmitting}>
            ×
          </button>
        </div>
        
        {showSuccess ? (
          <div className="modal-body success-message">
            <div className="success-icon">✓</div>
            <h3>Schedule Saved Successfully!</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            {isSubmitting && (
              <div className="loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label className="form-label">Schedule Type</label>
              <div className="schedule-type-toggle">
                <button
                  type="button"
                  className={`toggle-button ${!isMultiDay ? 'active' : ''}`}
                  onClick={() => setIsMultiDay(false)}
                  disabled={isSubmitting}
                >
                  Single Day
                </button>
                <button
                  type="button"
                  className={`toggle-button ${isMultiDay ? 'active' : ''}`}
                  onClick={() => setIsMultiDay(true)}
                  disabled={isSubmitting}
                >
                  Multiple Days
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                {isMultiDay ? 'Start Date' : 'Date'}
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
                required
                disabled={isSubmitting}
              />
            </div>

            {isMultiDay && (
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
                  disabled={isSubmitting}
                />
              </div>
            )}

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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                Schedule
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScheduleWorkerModal; 