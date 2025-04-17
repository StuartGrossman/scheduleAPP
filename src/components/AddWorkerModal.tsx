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
    tierId: '1',
    availability: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Ensure all required fields are present
      if (!worker.name || !worker.position) {
        alert('Name and position are required');
        setIsSubmitting(false);
        return;
      }

      await workerService.addWorker(worker as Worker);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form and close modal after delay
      setTimeout(() => {
        setWorker({
          name: '',
          position: '',
          email: '',
          phone: '',
          tier: '1',
          tierId: '1',
          availability: {}
        });
        onWorkerAdded();
        onClose();
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error adding worker:', error);
      alert('Failed to add worker. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add Team Member</h2>
          <button onClick={onClose} className="modal-close" disabled={isSubmitting}>
            ×
          </button>
        </div>
        
        {showSuccess ? (
          <div className="modal-body success-message">
            <div className="success-icon">✓</div>
            <h3>Team Member Added Successfully!</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            {isSubmitting && (
              <div className="loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
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
                disabled={isSubmitting}
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
                Add Worker
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddWorkerModal; 