import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Worker } from '../types/Worker';
import { useNavigate } from 'react-router-dom';
import ScheduleWorkerModal from '../components/ScheduleWorkerModal';
import { format } from 'date-fns';

const Workers: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const workersSnapshot = await getDocs(collection(db, 'workers'));
      const workersList = workersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Worker[];
      setWorkers(workersList);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workerId: string) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await deleteDoc(doc(db, 'workers', workerId));
        setWorkers(workers.filter(worker => worker.id !== workerId));
      } catch (error) {
        console.error('Error deleting worker:', error);
      }
    }
  };

  const handleEdit = (worker: Worker) => {
    navigate(`/workers/edit/${worker.id}`);
  };

  const handleViewSchedule = (worker: Worker) => {
    navigate(`/calendar?workerId=${worker.id}`);
  };

  const handleScheduleUpdated = () => {
    fetchWorkers();
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="team-header">
        <h2>Team Members</h2>
        <button
          onClick={() => navigate('/workers/add')}
          className="button button-primary"
        >
          Add Worker
        </button>
      </div>

      <div className="workers-list">
        {workers.map(worker => (
          <div key={worker.id} className="worker-card">
            <div className="worker-info">
              <h3>{worker.name}</h3>
              <p className="position">{worker.position}</p>
              <p className="contact">
                {worker.email} | {worker.phone}
              </p>
            </div>
            <div className="worker-actions">
              <button
                onClick={() => handleViewSchedule(worker)}
                className="button button-secondary"
              >
                View Schedule
              </button>
              <button
                onClick={() => handleEdit(worker)}
                className="button button-secondary"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(worker.id)}
                className="button button-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedWorker && (
        <ScheduleWorkerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedWorker(null);
          }}
          worker={selectedWorker}
          onScheduleUpdated={handleScheduleUpdated}
        />
      )}
    </div>
  );
};

export default Workers; 