import React, { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import axios from 'axios';

const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/dashboard/logs');
        // Transform the records into table format
        const formattedLogs = response.data.map((record, index) => {
             const theDate = new Date(record.timeIn);
             return {
                 id: record.id || index,
                 rawDate: theDate,
                 date: theDate.toLocaleDateString(),
                 time: theDate.toLocaleTimeString(),
                 event: 'SUCCESS',
                 name: record.name || 'Unknown',
                 role: record.role || 'Unknown',
                 message: `Face matched successfully`
             };
        });
        setLogs(formattedLogs);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.event.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (filterDate) {
      const localLogDateString = new Date(log.rawDate.getTime() - (log.rawDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      matchesDate = localLogDateString === filterDate;
    }
    
    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>System Report Logs</h1>
        <button className="btn btn-outline">
            <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
                type="text" 
                placeholder="Search by name, role, or event..." 
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
             <div style={{ padding: '3rem', textAlign: 'center' }}>Loading logs...</div>
          ) : (
             <table>
               <thead>
                 <tr>
                   <th>Date</th>
                   <th>Time</th>
                   <th>Name</th>
                   <th>Role</th>
                   <th>Event</th>
                   <th>Message</th>
                 </tr>
               </thead>
               <tbody>
                 {currentLogs.map((log) => (
                   <tr key={log.id}>
                     <td>{log.date}</td>
                     <td style={{ color: 'var(--success)' }}>{log.time}</td>
                     <td style={{ fontWeight: 500 }}>{log.name}</td>
                     <td>
                       <span className={`badge ${log.role.toLowerCase().replace(' ', '-')}`}>
                         {log.role}
                       </span>
                     </td>
                     <td>
                         <span className={`badge`} style={{ background: log.event === 'SUCCESS' ? 'var(--success-bg)' : 'rgba(239, 68, 68, 0.1)', color: log.event === 'SUCCESS' ? 'var(--success)' : 'var(--error)' }}>
                             {log.event}
                         </span>
                     </td>
                     <td style={{ color: 'var(--text-secondary)' }}>{log.message}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          )}
          
          {!isLoading && filteredLogs.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No system logs found matching your search.
              </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} entries
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

export default Logs;
