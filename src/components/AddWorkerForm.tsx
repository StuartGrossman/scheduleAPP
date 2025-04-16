import React, { useState } from 'react';
import { Worker } from '../types/Worker';
import { workerService } from '../services/workerService';

const AddWorkerForm: React.FC = () => {
  const [worker, setWorker] = useState<Worker>({
    name: '',
    position: '',
    availability: {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workerService.addWorker(worker);
      setWorker({
        name: '',
        position: '',
        availability: {}
      });
      alert('Worker added successfully!');
    } catch (error) {
      console.error('Error adding worker:', error);
      alert('Failed to add worker. Please try again.');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Add Team Member</h2>
        <p>Fill in the details below</p>
      </div>
      
      <form onSubmit={handleSubmit} className="card-body">
        <div className="form-group">
          <label 
            htmlFor="name"
            className="form-label"
          >
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
          <label 
            htmlFor="position"
            className="form-label"
          >
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

        <button type="submit" className="button button-primary">
          Add Team Member
        </button>
      </form>
    </div>
  );
};

export default AddWorkerForm; 