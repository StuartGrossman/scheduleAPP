import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
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

interface DailySummary {
  date: string;
  hours: number;
  cost: number;
  tierBreakdown: {
    [tierId: string]: {
      hours: number;
      cost: number;
    };
  };
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

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      // First, fetch all workers and tiers
      const [workersData, tiersData] = await Promise.all([
        getDocs(collection(db, 'workers')),
        getDocs(collection(db, 'tiers'))
      ]);

      const workersList = workersData.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Worker[];

      const tiersList = tiersData.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tier[];

      setWorkers(workersList);
      setTiers(tiersList);

      // Fetch all schedules for the month and filter in memory
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('startTime', '>=', startDate.toISOString()),
        where('startTime', '<=', endDate.toISOString())
      );

      const schedulesSnapshot = await getDocs(schedulesQuery);
      const allSchedules = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().startTime)
      })) as TimeSlot[];

      setTimeSlots(allSchedules);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailySummary = (): DailySummary[] => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });

    return days.map(day => {
      const daySlots = timeSlots.filter(slot => 
        new Date(slot.startTime).toDateString() === day.toDateString()
      );

      const tierBreakdown: { [tierId: string]: { hours: number; cost: number } } = {};
      let totalHours = 0;
      let totalCost = 0;

      daySlots.forEach(slot => {
        const worker = workers.find(w => w.id === slot.workerId);
        if (!worker) return;

        const tier = tiers.find(t => t.id === worker.tierId);
        if (!tier) return;

        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const cost = hours * tier.hourlyRate;

        if (!tierBreakdown[tier.id]) {
          tierBreakdown[tier.id] = { hours: 0, cost: 0 };
        }
        tierBreakdown[tier.id].hours += hours;
        tierBreakdown[tier.id].cost += cost;
        totalHours += hours;
        totalCost += cost;
      });

      return {
        date: format(day, 'MMM d'),
        hours: totalHours,
        cost: totalCost,
        tierBreakdown
      };
    });
  };

  const calculateMonthlyTotals = () => {
    const dailySummary = calculateDailySummary();
    const totalHours = dailySummary.reduce((total, day) => total + day.hours, 0);
    const totalCost = dailySummary.reduce((total, day) => total + day.cost, 0);
    
    const tierTotals = tiers.reduce((acc, tier) => {
      const tierHours = dailySummary.reduce((total, day) => 
        total + (day.tierBreakdown[tier.id]?.hours || 0), 0);
      const tierCost = dailySummary.reduce((total, day) => 
        total + (day.tierBreakdown[tier.id]?.cost || 0), 0);
      
      acc[tier.id] = {
        name: tier.name,
        hours: tierHours,
        cost: tierCost,
        color: tier.color
      };
      return acc;
    }, {} as { [key: string]: { name: string; hours: number; cost: number; color: string } });

    return {
      totalHours,
      totalCost,
      tierTotals
    };
  };

  const chartData = {
    labels: calculateDailySummary().map(day => day.date),
    datasets: tiers.map(tier => ({
      label: `${tier.name} Hours`,
      data: calculateDailySummary().map(day => day.tierBreakdown[tier.id]?.hours || 0),
      borderColor: tier.color,
      backgroundColor: `${tier.color}33`,
      tension: 0.4,
      yAxisID: 'y'
    })).concat(tiers.map(tier => ({
      label: `${tier.name} Cost`,
      data: calculateDailySummary().map(day => day.tierBreakdown[tier.id]?.cost || 0),
      borderColor: tier.color,
      backgroundColor: `${tier.color}33`,
      tension: 0.4,
      yAxisID: 'y1',
      borderDash: [5, 5]
    })))
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Hours and Costs by Tier'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cost ($)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  const { totalHours, totalCost, tierTotals } = calculateMonthlyTotals();

  return (
    <div className="container">
      <div className="estimates-header">
        <h1>Monthly Estimates</h1>
        <div className="month-navigation">
          <button onClick={handlePreviousMonth} className="button button-secondary">
            Previous Month
          </button>
          <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={handleNextMonth} className="button button-secondary">
            Next Month
          </button>
        </div>
      </div>
      
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

      {tiers.map(tier => {
        const tierData = tierTotals[tier.id];
        const tierChartData = {
          labels: calculateDailySummary().map(day => day.date),
          datasets: [
            {
              label: 'Hours',
              data: calculateDailySummary().map(day => day.tierBreakdown[tier.id]?.hours || 0),
              borderColor: tier.color,
              backgroundColor: `${tier.color}33`,
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: 'Cost',
              data: calculateDailySummary().map(day => day.tierBreakdown[tier.id]?.cost || 0),
              borderColor: tier.color,
              backgroundColor: `${tier.color}33`,
              tension: 0.4,
              yAxisID: 'y1',
              borderDash: [5, 5]
            }
          ]
        };

        return (
          <div key={tier.id} className="card">
            <div className="tier-estimates">
              <div className="tier-estimate-card" style={{ borderLeftColor: tier.color }}>
                <h3>{tier.name} Hours</h3>
                <p className="summary-value">{tierData.hours.toFixed(1)}</p>
              </div>
              <div className="tier-estimate-card" style={{ borderLeftColor: tier.color }}>
                <h3>{tier.name} Cost</h3>
                <p className="summary-value">${tierData.cost.toFixed(2)}</p>
              </div>
              <div className="tier-estimate-card" style={{ borderLeftColor: tier.color }}>
                <h3>Hourly Rate</h3>
                <p className="summary-value">${tier.hourlyRate.toFixed(2)}</p>
              </div>
            </div>
            <div className="chart-container">
              <Line data={tierChartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: `${tier.name} Daily Hours and Costs`
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Hours'
                    }
                  },
                  y1: {
                    beginAtZero: true,
                    position: 'right' as const,
                    title: {
                      display: true,
                      text: 'Cost ($)'
                    },
                    grid: {
                      drawOnChartArea: false
                    }
                  }
                }
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Estimates; 