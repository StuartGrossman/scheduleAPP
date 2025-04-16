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
  const [processedData, setProcessedData] = useState<{
    dailySummaries: DailySummary[];
    monthlyTotals: {
      totalHours: number;
      totalCost: number;
      tierTotals: { [key: string]: { name: string; hours: number; cost: number; color: string } };
    };
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      // Get all workers and their tiers first
      const workersSnapshot = await getDocs(collection(db, 'workers'));
      const tiersSnapshot = await getDocs(collection(db, 'tiers'));
      
      const workersList = workersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Worker[];
      
      const tiersList = tiersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tier[];

      // Get schedules for the month
      const schedulesSnapshot = await getDocs(query(
        collection(db, 'schedules'),
        where('startTime', '>=', startDate.toISOString()),
        where('startTime', '<=', endDate.toISOString())
      ));

      const schedulesList = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeSlot[];

      setWorkers(workersList);
      setTiers(tiersList);
      setTimeSlots(schedulesList);

      // Calculate processed data
      const dailySummaries = calculateDailySummary();
      const monthlyTotals = calculateMonthlyTotals(dailySummaries);
      
      setProcessedData({
        dailySummaries,
        monthlyTotals
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotals = (dailySummaries: DailySummary[]) => {
    const tierTotals: { [key: string]: { name: string; hours: number; cost: number; color: string } } = {};
    
    // Initialize tier totals
    tiers.forEach(tier => {
      tierTotals[tier.id] = {
        name: tier.name,
        hours: 0,
        cost: 0,
        color: tier.color
      };
    });

    let totalHours = 0;
    let totalCost = 0;

    // Sum up daily totals
    dailySummaries.forEach(day => {
      totalHours += day.hours || 0;
      totalCost += day.cost || 0;
      
      Object.entries(day.tierBreakdown || {}).forEach(([tierId, breakdown]) => {
        if (tierTotals[tierId]) {
          tierTotals[tierId].hours += breakdown?.hours || 0;
          tierTotals[tierId].cost += breakdown?.cost || 0;
        }
      });
    });

    return {
      totalHours,
      totalCost,
      tierTotals
    };
  };

  const calculateDailySummary = () => {
    // Get all days in the month
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Get all slots for this day
      const daySlots = timeSlots.filter(slot => {
        const slotDate = new Date(slot.startTime);
        return format(slotDate, 'yyyy-MM-dd') === dayStr;
      });

      // Initialize tier breakdown
      const tierBreakdown: { [tierId: string]: { hours: number; cost: number } } = {};
      tiers.forEach(tier => {
        tierBreakdown[tier.id] = { hours: 0, cost: 0 };
      });

      // Calculate totals
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

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  if (loading || !processedData) {
    return <div className="container">Loading...</div>;
  }

  // Use processedData for the chart
  const chartData = {
    labels: processedData.dailySummaries.map(day => day.date),
    datasets: tiers.map(tier => ({
      label: `${tier.name} Hours`,
      data: processedData.dailySummaries.map(day => day.tierBreakdown[tier.id]?.hours || 0),
      borderColor: tier.color,
      backgroundColor: `${tier.color}33`,
      tension: 0.4,
      yAxisID: 'y'
    })).concat(tiers.map(tier => ({
      label: `${tier.name} Cost`,
      data: processedData.dailySummaries.map(day => day.tierBreakdown[tier.id]?.cost || 0),
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
          <p className="summary-value">{(processedData?.monthlyTotals?.totalHours || 0).toFixed(1)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Cost</h3>
          <p className="summary-value">${(processedData?.monthlyTotals?.totalCost || 0).toFixed(2)}</p>
        </div>
      </div>

      {tiers.map(tier => {
        const tierData = processedData?.monthlyTotals?.tierTotals?.[tier.id] || {
          name: tier.name,
          hours: 0,
          cost: 0,
          color: tier.color
        };

        const tierChartData = {
          labels: processedData?.dailySummaries?.map(day => day.date) || [],
          datasets: [
            {
              label: 'Hours',
              data: processedData?.dailySummaries?.map(day => day.tierBreakdown?.[tier.id]?.hours || 0) || [],
              borderColor: tier.color,
              backgroundColor: `${tier.color}33`,
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: 'Cost',
              data: processedData?.dailySummaries?.map(day => day.tierBreakdown?.[tier.id]?.cost || 0) || [],
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
              <Line data={tierChartData} options={chartOptions} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Estimates; 