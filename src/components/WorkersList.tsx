import React, { useEffect, useState } from 'react';
import { Worker, TimeSlot } from '../types/Worker';
import { workerService } from '../services/workerService';
import { scheduleService } from '../services/scheduleService';
import EditWorkerModal from './EditWorkerModal';
import ScheduleWorkerModal from './ScheduleWorkerModal';
import ViewScheduleModal from './ViewScheduleModal';
import { format } from 'date-fns';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Tier {
  id: string;
  name: string;
  hourlyRate: number;
  color: string;
}

const WorkersList: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [schedules, setSchedules] = useState<Record<string, any[]>>({});
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workersData, schedulesData, tiersData] = await Promise.all([
        workerService.getWorkers(),
        scheduleService.getSchedules(new Date(), new Date(new Date().setDate(new Date().getDate() + 1))),
        getDocs(collection(db, 'tiers'))
      ]);
      
      setWorkers(workersData);
      
      // Organize schedules by worker
      const workerSchedules: Record<string, any[]> = {};
      schedulesData.forEach(schedule => {
        if (!workerSchedules[schedule.workerId]) {
          workerSchedules[schedule.workerId] = [];
        }
        workerSchedules[schedule.workerId].push(schedule);
      });
      
      setSchedules(workerSchedules);
      setTiers(tiersData.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tier[]);
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

  const handleTierClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsTierModalOpen(true);
  };

  const handleTierChange = async (newTier: string) => {
    if (!selectedWorker) return;
    
    try {
      // Get the tier details for the new tier
      const newTierData = tiers.find(t => t.id === newTier);
      if (!newTierData) {
        throw new Error('Tier not found');
      }
      
      const { color: tierColor, hourlyRate } = newTierData;
      if (!tierColor || typeof hourlyRate !== 'number') {
        throw new Error('Invalid tier data');
      }

      // Update worker's tier information
      await workerService.updateWorker(selectedWorker.id, {
        ...selectedWorker,
        tier: newTier,
        tierId: newTier
      });

      // Get all schedules for the worker
      const schedulesSnapshot = await getDocs(query(
        collection(db, 'schedules'),
        where('workerId', '==', selectedWorker.id)
      ));

      // Update each schedule with the new tier information
      const updatePromises = schedulesSnapshot.docs.map(async (doc) => {
        const scheduleData = doc.data() as TimeSlot;
        
        // Calculate duration in hours if not already present
        const durationInHours = scheduleData.durationInHours || 
          (new Date(scheduleData.endTime).getTime() - new Date(scheduleData.startTime).getTime()) / (1000 * 60 * 60);
        
        // Update the schedule with new tier information
        await scheduleService.updateSchedule(doc.id, {
          ...scheduleData,
          tierId: newTier,
          tierColor,
          hourlyRate,
          durationInHours
        });
      });

      // Wait for all schedule updates to complete
      await Promise.all(updatePromises);
      
      fetchData(); // Refresh the list
      setIsTierModalOpen(false);
    } catch (error) {
      console.error('Error updating worker tier:', error);
      alert('Failed to update worker tier. Please try again.');
    }
  };

  const getTierColor = (tierId: string | undefined) => {
    if (!tierId) return 'bg-gray-100 text-gray-800';
    
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return 'bg-gray-100 text-gray-800';
    
    // Convert hex color to RGB for background with opacity
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(tier.color);
    if (!rgb) return 'bg-gray-100 text-gray-800';

    return {
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
      color: tier.color
    };
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
        workers.map(worker => {
          const tier = tiers.find(t => t.id === worker.tier);
          const tierColor = getTierColor(worker.tier);
          
          return (
            <div key={worker.id} className="worker-card">
              <div className="worker-info">
                <div className="worker-details">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="worker-name" onClick={() => handleViewScheduleClick(worker)}>
                      {worker.name}
                      <span className="view-schedule-hint">Click to view schedule</span>
                    </h3>
                    <button
                      onClick={() => handleTierClick(worker)}
                      className={`tier-button px-3 py-1 rounded-full text-sm font-medium`}
                      style={{
                        backgroundColor: typeof tierColor === 'object' ? tierColor.background : tierColor,
                        color: typeof tierColor === 'object' ? tierColor.color : 'inherit'
                      }}
                    >
                      {tier?.name + ' Tier' || 'No Tier'}
                    </button>
                  </div>
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
          );
        })
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

      {/* Tier Selection Modal */}
      {selectedWorker && isTierModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Select Tier for {selectedWorker.name}</h2>
              <button onClick={() => setIsTierModalOpen(false)} className="modal-close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="tier-options">
                {tiers.map(tier => {
                  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(tier.color);
                  const background = rgb ? `rgba(${parseInt(rgb[1], 16)}, ${parseInt(rgb[2], 16)}, ${parseInt(rgb[3], 16)}, 0.1)` : '#f5f5f5';
                  
                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleTierChange(tier.id)}
                      className={`tier-option ${selectedWorker.tier === tier.id ? 'selected' : ''}`}
                      style={{
                        backgroundColor: background,
                        color: tier.color,
                        borderColor: selectedWorker.tier === tier.id ? tier.color : 'transparent'
                      }}
                    >
                      {tier.name} (${tier.hourlyRate.toFixed(2)}/hour)
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersList; 