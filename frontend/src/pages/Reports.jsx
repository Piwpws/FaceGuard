import React, { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import axios from 'axios';

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.role.toLowerCase().includes(searchTerm.toLowerCase());
                          
    let matchesDate = true;
    if (filterDate) {
      if (report.timeIn) {
        const d = new Date(report.timeIn);
        const localLogDateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        matchesDate = localLogDateString === filterDate;
      } else if (report.date) {
        matchesDate = report.date === filterDate || report.date.includes(filterDate);
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
            <input 
                type="date" 
                className="form-input" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
                <button 
                  className="btn btn-outline" 
                  onClick={() => setFilterDate('')}
                  style={{ padding: '0.5rem', marginLeft: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Clear Date Filter"
                >
                  Clear
                </button>
            )}
        </div>
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
                 {currentReports.map((report) => (
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

          {!isLoading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReports.length)} of {filteredReports.length} entries
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setCurrentPage(page)}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="btn btn-outline" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
