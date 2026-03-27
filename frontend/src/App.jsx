import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Enrollment from './pages/Enrollment';
import Scanning from './pages/Scanning';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import Maintenance from './pages/Maintenance';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/scanning" element={<Scanning />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/maintenance" element={<Maintenance />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
