import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TimeSlot {
  id: string;
  workerId: string;
  startTime: string;
  endTime: string;
  date: Date;
}

interface Worker {
  id: string;
  name: string;
  tierId: string;
}

interface Tier {
  id: string;
  name: string;
  hourlyRate: number;
  color: string;
}

const Estimates: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsData, workersData, tiersData] = await Promise.all([
        getDocs(query(
          collection(db, 'schedules'),
          where('date', '>=', startOfMonth(currentMonth)),
          where('date', '<=', endOfMonth(currentMonth))
        )),
        getDocs(collection(db, 'workers')),
        getDocs(collection(db, 'tiers'))
      ]);

      setTimeSlots(slotsData.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeSlot[]);

      setWorkers(workersData.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Worker[]);

      setTiers(tiersData.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tier[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyHours = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });

    return days.map(day => {
      const daySlots = timeSlots.filter(slot => 
        new Date(slot.date).toDateString() === day.toDateString()
      );

      const totalHours = daySlots.reduce((total, slot) => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);

      return {
        date: format(day, 'MMM d'),
        hours: totalHours
      };
    });
  };

  const calculateMonthlyTotals = () => {
    const dailyHours = calculateDailyHours();
    const totalHours = dailyHours.reduce((total, day) => total + day.hours, 0);
    
    const totalCost = timeSlots.reduce((total, slot) => {
      const worker = workers.find(w => w.id === slot.workerId);
      const tier = tiers.find(t => t.id === worker?.tierId);
      if (!tier) return total;

      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      return total + (hours * tier.hourlyRate);
    }, 0);

    return {
      totalHours,
      totalCost
    };
  };

  const chartData = {
    labels: calculateDailyHours().map(day => day.date),
    datasets: [
      {
        label: 'Daily Hours',
        data: calculateDailyHours().map(day => day.hours),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Hours Worked'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  const { totalHours, totalCost } = calculateMonthlyTotals();

  return (
    <div className="container">
      <h1>Monthly Estimates</h1>
      
      <div className="estimates-summary">
        <div className="summary-card">
          <h3>Total Hours</h3>
          <p className="summary-value">{totalHours.toFixed(1)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Cost</h3>
          <p className="summary-value">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="card">
        <h2>Daily Hours Overview</h2>
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Estimates; 