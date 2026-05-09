import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function statusBadge(s) {
  if (s === 'TODO') return <span className="badge badge-todo">Todo</span>;
  if (s === 'IN_PROGRESS') return <span className="badge badge-inprogress">In Progress</span>;
  if (s === 'DONE') return <span className="badge badge-done">Done</span>;
  return null;
}

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, oRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/tasks/overdue'),
        ]);
        setStats(sRes.data);
        setOverdue(oRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ fontSize: 14, color: '#64748b' }}>
          Hello, <strong>{user.name}</strong> 👋
        </span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalProjects}</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#64748b' }}>{stats.tasksTodo}</div>
            <div className="stat-label">To Do</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#d97706' }}>{stats.tasksInProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#16a34a' }}>{stats.tasksDone}</div>
            <div className="stat-label">Done</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#dc2626' }}>{stats.overdueCount}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
          ⚠️ Overdue Tasks
        </h2>
        {overdue.length === 0 ? (
          <div className="empty-state">🎉 No overdue tasks — great work!</div>
        ) : (
          overdue.map((t) => (
            <div className="task-row" key={t.id}>
              <div style={{ flex: 1 }}>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  <Link to={`/projects/${t.project?.id}`}>{t.project?.name}</Link>
                  {t.assignee && <> · Assigned to {t.assignee.name}</>}
                </div>
              </div>
              {statusBadge(t.status)}
              <span className="badge badge-overdue">Due {t.dueDate}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
