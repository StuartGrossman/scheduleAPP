import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Tier {
  id: string;
  name: string;
  hourlyRate: number;
  color: string;
}

const Settings: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [newTier, setNewTier] = useState<Omit<Tier, 'id'>>({ name: '', hourlyRate: 0, color: '#3498db' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tiers'));
      const tiersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tier[];
      setTiers(tiersData);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate hourly rate
      if (isNaN(newTier.hourlyRate) || newTier.hourlyRate < 0) {
        console.error('Invalid hourly rate');
        return;
      }

      const docRef = await addDoc(collection(db, 'tiers'), newTier);
      setTiers([...tiers, { id: docRef.id, ...newTier }]);
      setNewTier({ name: '', hourlyRate: 0, color: '#3498db' });
    } catch (error) {
      console.error('Error adding tier:', error);
    }
  };

  const handleUpdateTier = async (id: string, updatedTier: Partial<Tier>) => {
    try {
      await updateDoc(doc(db, 'tiers', id), updatedTier);
      setTiers(tiers.map(tier => tier.id === id ? { ...tier, ...updatedTier } : tier));
    } catch (error) {
      console.error('Error updating tier:', error);
    }
  };

  const handleDeleteTier = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tiers', id));
      setTiers(tiers.filter(tier => tier.id !== id));
    } catch (error) {
      console.error('Error deleting tier:', error);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Settings</h1>
      
      <div className="card">
        <h2>Worker Tiers</h2>
        <p className="text-muted">Manage worker tiers and their hourly rates</p>
        
        <form onSubmit={handleAddTier} className="form">
          <div className="form-group">
            <label htmlFor="tierName">Tier Name</label>
            <input
              type="text"
              id="tierName"
              value={newTier.name}
              onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="hourlyRate">Hourly Rate ($)</label>
            <input
              type="number"
              id="hourlyRate"
              value={newTier.hourlyRate === 0 ? '' : newTier.hourlyRate}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setNewTier({ ...newTier, hourlyRate: 0 });
                } else {
                  const rate = parseFloat(value);
                  if (!isNaN(rate) && rate >= 0) {
                    setNewTier({ ...newTier, hourlyRate: rate });
                  }
                }
              }}
              required
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              type="color"
              id="color"
              value={newTier.color}
              onChange={(e) => setNewTier({ ...newTier, color: e.target.value })}
            />
          </div>
          
          <button type="submit" className="button">Add Tier</button>
        </form>
        
        <div className="tiers-list">
          {tiers.map(tier => (
            <div key={tier.id} className="tier-card" style={{ borderLeftColor: tier.color }}>
              <div className="tier-info">
                <h3>{tier.name}</h3>
                <p>${tier.hourlyRate.toFixed(2)}/hour</p>
              </div>
              <div className="tier-actions">
                <button
                  className="button button-secondary"
                  onClick={() => handleDeleteTier(tier.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings; 