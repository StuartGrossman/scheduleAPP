import React, { useState } from 'react';
import { Worker } from '../types/Worker';
import { workerService } from '../services/workerService';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkerAdded: () => void;
}

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose, onWorkerAdded }) => {
  const [worker, setWorker] = useState<Omit<Worker, 'id'>>({
    name: '',
    position: '',
    email: '',
    phone: '',
    tier: '1',
    availability: {}
  });

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure all required fields are present
      if (!worker.name || !worker.position) {
        alert('Name and position are required');
        return;
      }

      const addedWorker = await workerService.addWorker(worker as Worker);
      
      // Then schedule them if date and time are provided
      if (scheduleDate && scheduleTime) {
        // Here you would call your scheduling service
        // For now, we'll just log it
        console.log('Scheduling worker:', {
          workerId: addedWorker.id,
          date: scheduleDate,
          time: scheduleTime
        });
      }

      // Reset form
      setWorker({
        name: '',
        position: '',
        email: '',
        phone: '',
        tier: '1',
        availability: {}
      });
      setScheduleDate('');
      setScheduleTime('');

      onWorkerAdded();
      onClose();
      alert('Worker added successfully!');
    } catch (error) {
      console.error('Error adding worker:', error);
      alert('Failed to add worker. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add Team Member</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={worker.name}
              onChange={(e) => setWorker({ ...worker, name: e.target.value })}
              className="form-input"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="position" className="form-label">
              Position
            </label>
            <input
              id="position"
              type="text"
              value={worker.position}
              onChange={(e) => setWorker({ ...worker, position: e.target.value })}
              className="form-input"
              placeholder="e.g., Software Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tier" className="form-label">
              Tier
            </label>
            <select
              id="tier"
              value={worker.tier}
              onChange={(e) => setWorker({ ...worker, tier: e.target.value })}
              className="form-input"
              required
            >
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={worker.email}
              onChange={(e) => setWorker({ ...worker, email: e.target.value })}
              className="form-input"
              placeholder="worker@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={worker.phone}
              onChange={(e) => setWorker({ ...worker, phone: e.target.value })}
              className="form-input"
              placeholder="(123) 456-7890"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduleDate" className="form-label">
              Schedule Date
            </label>
            <input
              id="scheduleDate"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduleTime" className="form-label">
              Schedule Time
            </label>
            <input
              id="scheduleTime"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="button button-secondary">
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              Add Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkerModal; 