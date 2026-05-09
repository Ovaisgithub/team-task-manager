import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const load = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects');
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Project</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Project name</label>
              <input value={form.name} onChange={set('name')} required placeholder="e.g. Website Redesign" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={set('description')} placeholder="Optional short description" />
            </div>
            <button className="btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">No projects yet. Create one above!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map((p) => (
            <div className="card" key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  <Link to={`/projects/${p.id}`}>{p.name}</Link>
                </div>
                {p.description && (
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{p.description}</div>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Owner: {p.owner?.name}
                  {p.members?.length > 0 && (
                    <> · {p.members.length} member{p.members.length > 1 ? 's' : ''}</>
                  )}
                </div>
              </div>
              <Link to={`/projects/${p.id}`}>
                <button className="btn-outline" style={{ padding: '6px 14px' }}>Open</button>
              </Link>
              {(user.role === 'ADMIN' || user.userId === p.owner?.id) && (
                <button className="btn-danger" style={{ padding: '6px 14px' }} onClick={() => handleDelete(p.id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
