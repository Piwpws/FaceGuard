import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import axios from 'axios';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // We fetch the raw chronological logs from the backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/dashboard/logs');
        // Transform the records into terminal style logs
        const formattedLogs = response.data.map((record, index) => ({
             id: record.id || index,
             timestamp: new Date(record.timeIn).toLocaleString(),
             event: 'SUCCESS',
             message: `Face matched successfully: ${record.name} (${record.role})`
        }));
        setLogs(formattedLogs);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  return (
    <div>
      <h1 className="page-title">System Report Logs</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Raw system events for successful face recognition logs.</p>

      <div className="glass-card" style={{ fontFamily: 'monospace', padding: '0' }}>
         <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Terminal size={20} style={{ color: 'var(--accent-base)' }} />
             <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>System Console Logs</span>
         </div>
         <div style={{ padding: '1.5rem', maxHeight: '600px', overflowY: 'auto' }}>
            {isLoading ? <div>Loading logs...</div> : logs.length === 0 ? <div>No system logs yet.</div> : null}
            {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>[{log.timestamp}]</span>
                    <span style={{ color: log.event === 'SUCCESS' ? 'var(--success)' : (log.event === 'ERROR' ? 'var(--error)' : 'var(--accent-base)'), fontWeight: '600', width: '80px' }}>
                        {log.event}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{log.message}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Logs;
