import React, { useState } from 'react';
import AddWorkerModal from '../components/AddWorkerModal';
import WorkersList from '../components/WorkersList';

const Home: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWorkerAdded = () => {
    // Refresh the workers list or perform any other necessary actions
    console.log('Worker added, refreshing list...');
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="card">
        <div className="card-body">
          <h1>Schedule Manager</h1>
          <p>Manage your team's schedule efficiently</p>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="team-section">
          <div className="team-header">
            <h2>Team Members</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="button button-primary"
            >
              Add Team Member
            </button>
          </div>
          <WorkersList />
        </div>
      </main>

      {/* Footer */}
      <footer className="card">
        <div className="card-body">
          <p className="text-center">
            © {new Date().getFullYear()} Schedule Manager. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Modal */}
      <AddWorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWorkerAdded={handleWorkerAdded}
      />
    </div>
  );
};

export default Home; 