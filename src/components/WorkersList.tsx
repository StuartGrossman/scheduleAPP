import React, { useEffect, useState } from 'react';
import { Worker } from '../types/Worker';
import { workerService } from '../services/workerService';
import { scheduleService } from '../services/scheduleService';
import EditWorkerModal from './EditWorkerModal';
import ScheduleWorkerModal from './ScheduleWorkerModal';
import ViewScheduleModal from './ViewScheduleModal';
import { format } from 'date-fns';

const WorkersList: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [schedules, setSchedules] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const workersData = await workerService.getWorkers();
      setWorkers(workersData);
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const schedulesData = await scheduleService.getSchedules(today, tomorrow);
      
      // Organize schedules by worker
      const workerSchedules: Record<string, any[]> = {};
      schedulesData.forEach(schedule => {
        if (!workerSchedules[schedule.workerId]) {
          workerSchedules[schedule.workerId] = [];
        }
        workerSchedules[schedule.workerId].push(schedule);
      });
      
      setSchedules(workerSchedules);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerUpdated = () => {
    fetchData();
  };

  const handleWorkerDeleted = () => {
    fetchData();
  };

  const handleEditClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsEditModalOpen(true);
  };

  const handleScheduleClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsScheduleModalOpen(true);
  };

  const handleViewScheduleClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsViewScheduleModalOpen(true);
  };

  if (loading) {
    return (
      <div className="workers-list">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workers-list">
      {workers.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No team members added yet.</p>
        </div>
      ) : (
        workers.map(worker => (
          <div key={worker.id} className="worker-card">
            <div className="worker-info">
              <div className="worker-details">
                <h3 className="worker-name" onClick={() => handleViewScheduleClick(worker)}>
                  {worker.name}
                  <span className="view-schedule-hint">Click to view schedule</span>
                </h3>
                <p className="position">{worker.position}</p>
                {worker.email && <p className="contact">Email: {worker.email}</p>}
                {worker.phone && <p className="contact">Phone: {worker.phone}</p>}
                {schedules[worker.id]?.length > 0 && (
                  <div className="worker-schedule">
                    <h4>Today's Schedule:</h4>
                    {schedules[worker.id].map(schedule => (
                      <div key={schedule.id} className="schedule-item">
                        <span className="schedule-time">
                          {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="worker-actions">
                <button 
                  onClick={() => handleScheduleClick(worker)}
                  className="button button-primary"
                >
                  Add Schedule
                </button>
                <button 
                  onClick={() => handleEditClick(worker)}
                  className="button button-secondary"
                >
                  Edit Details
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Edit Modal */}
      {selectedWorker && (
        <EditWorkerModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedWorker(null);
          }}
          worker={selectedWorker}
          onWorkerUpdated={handleWorkerUpdated}
          onWorkerDeleted={handleWorkerDeleted}
        />
      )}

      {/* Schedule Modal */}
      {selectedWorker && (
        <ScheduleWorkerModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSelectedWorker(null);
          }}
          worker={selectedWorker}
          onScheduleUpdated={handleWorkerUpdated}
        />
      )}

      {/* View Schedule Modal */}
      {selectedWorker && (
        <ViewScheduleModal
          isOpen={isViewScheduleModalOpen}
          onClose={() => {
            setIsViewScheduleModalOpen(false);
            setSelectedWorker(null);
          }}
          worker={selectedWorker}
        />
      )}
    </div>
  );
};

export default WorkersList; 