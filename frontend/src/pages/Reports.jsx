import React, { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import axios from 'axios';

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/dashboard/reports');
        setReports(response.data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    report.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Attendance Report</h1>
        <button className="btn btn-outline">
            <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
                type="text" 
                placeholder="Search by name or role..." 
                className="form-input" 
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button className="btn btn-outline" style={{ height: '100%' }}>
            <Filter size={18} /> Filter Date
        </button>
      </div>

      <div className="glass-card">
        <div className="table-container">
          {isLoading ? (
             <div style={{ padding: '3rem', textAlign: 'center' }}>Loading reports...</div>
          ) : (
             <table>
               <thead>
                 <tr>
                   <th>Date</th>
                   <th>Name</th>
                   <th>Role</th>
                   <th>Time In</th>
                   <th>Time Out</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredReports.map((report) => (
                   <tr key={report.id}>
                     <td>{report.date}</td>
                     <td style={{ fontWeight: 500 }}>{report.name}</td>
                     <td>
                       <span className={`badge ${report.role.toLowerCase().replace(' ', '-')}`}>
                         {report.role}
                       </span>
                     </td>
                     <td style={{ color: 'var(--success)' }}>
                         {new Date(report.timeIn).toLocaleTimeString()}
                     </td>
                     <td style={{ color: report.timeOut === '--' ? 'var(--text-secondary)' : 'var(--error)' }}>
                         {report.timeOut !== '--' ? new Date(report.timeOut).toLocaleTimeString() : '--'}
                     </td>
                     <td>
                         <span className={`badge`} style={{ background: report.status === 'Present' ? 'var(--success-bg)' : 'rgba(239, 68, 68, 0.1)', color: report.status === 'Present' ? 'var(--success)' : 'var(--error)' }}>
                             {report.status}
                         </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          )}
          
          {!isLoading && filteredReports.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No attendance records found matching your search.
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
