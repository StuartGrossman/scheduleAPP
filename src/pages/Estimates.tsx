import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval } from 'date-fns';
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
  tierId: string;
  startTime: string;
  endTime: string;
  durationInHours: number;
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
  tierBreakdown: { [key: string]: { hours: number; cost: number } };
}

interface TierTotal {
  name: string;
  hours: number;
  cost: number;
  color: string;
}

interface MonthlyTotals {
  totalHours: number;
  totalCost: number;
  tierTotals: { [key: string]: TierTotal };
}

interface ProcessedData {
  dailySummaries: DailySummary[];
  monthlyTotals: MonthlyTotals;
}

const Estimates: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [totalHours, setTotalHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData>({
    dailySummaries: [],
    monthlyTotals: {
      totalHours: 0,
      totalCost: 0,
      tierTotals: {}
    }
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);

      // Get all tiers first
      const tiersSnapshot = await getDocs(collection(db, 'tiers'));
      const tiersList = tiersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tier[];
      setTiers(tiersList);

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

      // Calculate daily summaries
      const dailySummaries: DailySummary[] = [];
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      days.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySchedules = schedulesList.filter(schedule => 
          schedule.startTime.startsWith(dayStr)
        );

        const tierBreakdown: { [key: string]: { hours: number; cost: number } } = {};
        let totalHours = 0;
        let totalCost = 0;

        daySchedules.forEach(schedule => {
          const tier = tiersList.find(t => t.id === schedule.tierId);
          if (tier) {
            const hours = schedule.durationInHours || 0;
            const cost = hours * tier.hourlyRate;
            
            if (!tierBreakdown[tier.id]) {
              tierBreakdown[tier.id] = { hours: 0, cost: 0 };
            }
            
            tierBreakdown[tier.id].hours += hours;
            tierBreakdown[tier.id].cost += cost;
            totalHours += hours;
            totalCost += cost;
          }
        });

        dailySummaries.push({
          date: dayStr,
          hours: totalHours,
          cost: totalCost,
          tierBreakdown
        });
      });

      // Calculate monthly totals
      const monthlyTotals: MonthlyTotals = {
        totalHours: 0,
        totalCost: 0,
        tierTotals: {}
      };

      dailySummaries.forEach(summary => {
        monthlyTotals.totalHours += summary.hours;
        monthlyTotals.totalCost += summary.cost;

        Object.entries(summary.tierBreakdown).forEach(([tierId, breakdown]) => {
          if (!monthlyTotals.tierTotals[tierId]) {
            const tier = tiersList.find(t => t.id === tierId);
            if (tier) {
              monthlyTotals.tierTotals[tierId] = {
                name: tier.name,
                hours: 0,
                cost: 0,
                color: tier.color
              };
            }
          }
          if (monthlyTotals.tierTotals[tierId]) {
            monthlyTotals.tierTotals[tierId].hours += breakdown.hours;
            monthlyTotals.tierTotals[tierId].cost += breakdown.cost;
          }
        });
      });

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

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

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
          <p className="summary-value">{processedData.monthlyTotals.totalHours.toFixed(1)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Cost</h3>
          <p className="summary-value">${processedData.monthlyTotals.totalCost.toFixed(2)}</p>
        </div>
      </div>

      {tiers.map(tier => {
        const tierHours = processedData.monthlyTotals.tierTotals[tier.id]?.hours || 0;
        const tierCost = processedData.monthlyTotals.tierTotals[tier.id]?.cost || 0;

        return (
          <div key={tier.id} className="card">
            <div className="tier-estimates">
              <div className="tier-estimate-card" style={{ borderLeftColor: tier.color }}>
                <h3>{tier.name} Hours</h3>
                <p className="summary-value">{tierHours.toFixed(1)}</p>
              </div>
              <div className="tier-estimate-card" style={{ borderLeftColor: tier.color }}>
                <h3>{tier.name} Cost</h3>
                <p className="summary-value">${tierCost.toFixed(2)}</p>
              </div>
              <div className="tier-estimate-card" style={{ borderLeftColor: tier.color }}>
                <h3>Hourly Rate</h3>
                <p className="summary-value">${tier.hourlyRate.toFixed(2)}</p>
              </div>
            </div>
            <div className="chart-container">
              <Line 
                data={{
                  labels: processedData.dailySummaries.map(day => day.date),
                  datasets: [
                    {
                      label: `${tier.name} Cost`,
                      data: processedData.dailySummaries.map(day => day.tierBreakdown[tier.id]?.cost || 0),
                      borderColor: tier.color,
                      backgroundColor: 'rgba(54, 162, 235, 0.2)',
                      borderWidth: 2,
                      fill: true
                    }
                  ]
                }} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: true,
                      text: 'Daily Costs by Tier'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Cost ($)'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Estimates; 