import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  ScanFace, 
  CalendarClock, 
  ClipboardList,
  UserCog
} from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <ScanFace size={28} className="text-accent-base" />
        <span>FaceGuard</span>
      </div>
      <nav>
        <ul className="nav-links">
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/enrollment" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserPlus size={20} />
              Enrollment
            </NavLink>
          </li>
          <li>
            <NavLink to="/scanning" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ScanFace size={20} />
              Live Scanning
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <CalendarClock size={20} />
              Attendance Report
            </NavLink>
          </li>
          <li>
            <NavLink to="/logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} />
              Report Logs
            </NavLink>
          </li>
          <li>
            <NavLink to="/maintenance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCog size={20} />
              File Maintenance
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
