import React, { useState, useEffect } from 'react';
import { Users, UserCheck, TrendingUp } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    presentToday: 0,
    attendanceRate: 0,
    studentsPresent: 0,
    nonStudentsPresent: 0,
    recentAttendees: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-title">Total Enrolled</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {stats.totalEnrolled} <Users size={32} style={{ color: 'var(--accent-base)' }}/>
          </div>
        </div>
        
        <div className="glass-card stat-card">
          <div className="stat-title">Attendees Today</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {stats.presentToday} <UserCheck size={32} style={{ color: 'var(--success)' }}/>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {stats.studentsPresent} Students • {stats.nonStudentsPresent} Non-Students
          </div>
        </div>
        
        <div className="glass-card stat-card">
          <div className="stat-title">Attendance Rate</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {stats.attendanceRate}% <TrendingUp size={32} style={{ color: '#fbbf24' }}/>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Recent Attendees Today</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Time Log</th>
                <th>Log Type</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAttendees && stats.recentAttendees.length === 0 ? (
                 <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No attendees logged today yet.</td>
                 </tr>
              ) : (
                stats.recentAttendees.map((attendee) => (
                  <tr key={attendee.id}>
                    <td style={{ fontWeight: 500 }}>{attendee.name}</td>
                    <td>
                      <span className={`badge ${attendee.role.toLowerCase().replace(' ', '-')}`}>
                        {attendee.role}
                      </span>
                    </td>
                    <td>{new Date(attendee.time).toLocaleTimeString()}</td>
                    <td style={{ color: attendee.status === "Time In" ? 'var(--success)' : 'var(--error)' }}>
                        {attendee.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
