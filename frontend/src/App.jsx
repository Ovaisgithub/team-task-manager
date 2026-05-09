import React from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navStyle = ({ isActive }) => ({
    color: isActive ? '#4f46e5' : '#64748b',
    fontWeight: isActive ? 600 : 400,
    textDecoration: 'none',
    fontSize: '14px',
  });

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      height: '56px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <span style={{ fontWeight: 700, fontSize: '16px', color: '#4f46e5', marginRight: 8 }}>
        ✅ TaskFlow
      </span>
      {user && <>
        <NavLink to="/" style={navStyle} end>Dashboard</NavLink>
        <NavLink to="/projects" style={navStyle}>Projects</NavLink>
      </>}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {user.name}
              &nbsp;
              <span className={`badge badge-${user.role?.toLowerCase()}`}>{user.role}</span>
            </span>
            <button className="btn-ghost" style={{ padding: '6px 14px' }} onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={navStyle}>Login</NavLink>
            <NavLink to="/register" style={navStyle}>Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 20px' }}>
        <Routes>
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
