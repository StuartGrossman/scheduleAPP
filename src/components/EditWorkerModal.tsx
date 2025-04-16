import React, { useState } from 'react';
import { Worker } from '../types/Worker';
import { workerService } from '../services/workerService';

interface EditWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  onWorkerUpdated: () => void;
  onWorkerDeleted: () => void;
}

const EditWorkerModal: React.FC<EditWorkerModalProps> = ({
  isOpen,
  onClose,
  worker,
  onWorkerUpdated,
  onWorkerDeleted
}) => {
  const [formData, setFormData] = useState<Omit<Worker, 'id'>>({
    name: worker.name || '',
    position: worker.position || '',
    email: worker.email || '',
    phone: worker.phone || '',
    availability: worker.availability || {}
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await workerService.updateWorker(worker.id, formData);
      onWorkerUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating worker:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await workerService.deleteWorker(worker.id);
      onWorkerDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting worker:', error);
    } finally {
      setIsSubmitting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Team Member</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Position</label>
              <input
                type="text"
                className="form-input"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="button button-danger"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isSubmitting}
            >
              Delete
            </button>
            <div className="flex-grow"></div>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Confirm Deletion</h3>
                <button className="modal-close" onClick={() => setIsDeleteConfirmOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete {worker.name}? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditWorkerModal; 