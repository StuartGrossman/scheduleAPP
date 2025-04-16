import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { Worker } from '../types/Worker';
import { workerService } from '../services/workerService';
import { scheduleService } from '../services/scheduleService';
import DayDetailsModal from '../components/DayDetailsModal';

interface TimeSlot {
  id: string;
  workerId: string;
  workerName: string;
  startTime: string;
  endTime: string;
  position: string;
  date: Date;
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
    const daySchedule = schedules.find(s => s.date.getTime() === day.getTime());
    setSelectedDate(day);
    setSelectedDaySchedule(daySchedule || null);
  };

  const getTimeSlotColor = (position: string) => {
    const colors: Record<string, string> = {
      'Developer': '#e3f2fd',
      'Designer': '#e8f5e9',
      'Manager': '#fff3e0',
      'default': '#f5f5f5'
    };
    return colors[position] || colors.default;
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
                      style={{ backgroundColor: getTimeSlotColor(slot.position) }}
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
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          timeSlots={selectedDaySchedule?.timeSlots || []}
        />
      )}
    </div>
  );
};

export default Calendar; 