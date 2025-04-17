import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { Worker } from '../types/Worker';
import { workerService } from '../services/workerService';
import { scheduleService } from '../services/scheduleService';
import DayDetailsModal from '../components/DayDetailsModal';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Tier {
  id: string;
  name: string;
  hourlyRate: number;
  color: string;
}

interface TimeSlot {
  id: string;
  workerId: string;
  workerName: string;
  startTime: string;
  endTime: string;
  position: string;
  date: Date;
  tierId?: string;
  tierColor?: string;
}

interface DaySchedule {
  date: Date;
  timeSlots: TimeSlot[];
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<DaySchedule | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [selectedDaySlots, setSelectedDaySlots] = useState<TimeSlot[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      // Get all tiers first
      const tiersSnapshot = await getDocs(collection(db, 'tiers'));
      const tiersList = tiersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tier[];
      
      // Get schedules for the month
      const schedulesData = await scheduleService.getSchedules(startDate, endDate);
      
      // Organize schedules by day
      const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
      const schedulesByDay = daysInMonth.map(day => ({
        date: day,
        timeSlots: schedulesData
          .filter(slot => {
            const slotDate = new Date(slot.startTime);
            return format(slotDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          })
          .map(slot => {
            const tier = tiersList.find(t => t.id === slot.tierId);
            return {
              ...slot,
              tierColor: tier?.color
            };
          })
      }));
      
      setSchedules(schedulesByDay);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [workersData, schedulesData] = await Promise.all([
          workerService.getWorkers(),
          scheduleService.getSchedules(startOfMonth(currentDate), endOfMonth(currentDate))
        ]);
        
        setWorkers(workersData);
        
        // Organize schedules by day
        const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
        const organizedSchedules = days.map(date => ({
          date,
          timeSlots: schedulesData.filter(slot => 
            slot.date.toDateString() === date.toDateString()
          )
        }));
        
        setSchedules(organizedSchedules);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    const daySlots = schedules.find(s => s.date.getTime() === day.getTime())?.timeSlots || [];
    setSelectedDate(day);
    setSelectedDaySlots(daySlots);
    setIsDayDetailsOpen(true);
  };

  const handleScheduleDeleted = () => {
    fetchData(); // Refresh the data after deletion
    setIsDayDetailsOpen(false); // Close the modal
  };

  const getTimeSlotColor = (tierColor?: string) => {
    if (tierColor) {
      // Convert hex to rgba with 0.1 opacity for background
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };

      const rgb = hexToRgb(tierColor);
      if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
      }
    }
    return '#f5f5f5'; // Default color if no tier color is available
  };

  const handleViewSchedule = (slot: TimeSlot) => {
    // Implement the logic to view the schedule for the selected slot
    console.log('View schedule for:', slot);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="calendar-loading">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="calendar-header">
        <h1>Schedule Calendar</h1>
        <div className="calendar-controls">
          <button onClick={handlePrevMonth} className="button button-secondary">
            Previous Month
          </button>
          <h2>{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={handleNextMonth} className="button button-secondary">
            Next Month
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Weekday headers */}
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-days">
          {schedules.map((daySchedule) => {
            const day = daySchedule.date;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`calendar-day ${!isCurrentMonth ? 'calendar-day-other-month' : ''} ${isCurrentDay ? 'calendar-day-today' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                <div className="calendar-day-slots">
                  {daySchedule.timeSlots.map(slot => (
                    <div 
                      key={slot.id} 
                      className="calendar-slot"
                      style={{ 
                        backgroundColor: getTimeSlotColor(slot.tierColor),
                        borderLeft: `4px solid ${slot.tierColor || '#ccc'}`
                      }}
                    >
                      <div className="calendar-slot-worker">
                        <strong>{slot.workerName}</strong>
                        <span>{slot.position}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDate && (
        <DayDetailsModal
          isOpen={isDayDetailsOpen}
          onClose={() => setIsDayDetailsOpen(false)}
          date={selectedDate}
          timeSlots={selectedDaySlots}
          onScheduleDeleted={handleScheduleDeleted}
        />
      )}
    </div>
  );
};

export default Calendar; 