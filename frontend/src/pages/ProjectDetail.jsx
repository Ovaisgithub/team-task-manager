import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function StatusBadge({ status }) {
  const map = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', DONE: 'badge-done' };
  const label = { TODO: 'Todo', IN_PROGRESS: 'In Progress', DONE: 'Done' };
  return <span className={`badge ${map[status] || ''}`}>{label[status] || status}</span>;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwnerOrAdmin = (project) =>
    user.role === 'ADMIN' || user.userId === project?.owner?.id;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');

  // Task form state
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', assigneeId: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

  // Member form state
  const [memberUserId, setMemberUserId] = useState('');
  const [showMemberForm, setShowMemberForm] = useState(false);

  const load = async () => {
    try {
      const [pRes, tRes, uRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
        api.get('/users'),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
      setAllUsers(uRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project');
    }
  };

  useEffect(() => { load(); }, [id]);

  const setTF = (k) => (e) => setTaskForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setTaskLoading(true);
    try {
      const body = {
        title: taskForm.title,
        description: taskForm.description || undefined,
        dueDate: taskForm.dueDate || undefined,
        assignee: taskForm.assigneeId ? { id: Number(taskForm.assigneeId) } : undefined,
      };
      await api.post(`/projects/${id}/tasks`, body);
      setTaskForm({ title: '', description: '', dueDate: '', assigneeId: '' });
      setShowTaskForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUserId) return;
    try {
      await api.post(`/projects/${id}/members/${memberUserId}`);
      setMemberUserId('');
      setShowMemberForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (uid) => {
    try {
      await api.delete(`/projects/${id}/members/${uid}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (!project) return <div style={{ padding: 40, color: '#64748b' }}>Loading…</div>;

  // Users not yet in the project (for add-member dropdown)
  const memberIds = new Set((project.members || []).map((m) => m.id));
  memberIds.add(project.owner?.id);
  const addableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  const tasksByStatus = (s) => tasks.filter((t) => t.status === s);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
        <Link to="/projects">Projects</Link> / {project.name}
      </div>

      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && (
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{project.description}</p>
          )}
        </div>
        {isOwnerOrAdmin(project) && (
          <button className="btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
            {showTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Add Task Form */}
      {showTaskForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Task</h2>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Title</label>
              <input value={taskForm.title} onChange={setTF('title')} required placeholder="Task title" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={taskForm.description} onChange={setTF('description')} placeholder="Optional" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={taskForm.dueDate} onChange={setTF('dueDate')} />
              </div>
              <div className="form-group">
                <label>Assign to</label>
                <select value={taskForm.assigneeId} onChange={setTF('assigneeId')}>
                  <option value="">— Unassigned —</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn-primary" disabled={taskLoading}>
              {taskLoading ? 'Adding…' : 'Add Task'}
            </button>
          </form>
        </div>
      )}

      {/* Task columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => {
          const labels = { TODO: '📋 To Do', IN_PROGRESS: '🔄 In Progress', DONE: '✅ Done' };
          return (
            <div className="card" key={status} style={{ padding: '16px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#475569' }}>
                {labels[status]} ({tasksByStatus(status).length})
              </h3>
              {tasksByStatus(status).length === 0 && (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>No tasks</p>
              )}
              {tasksByStatus(status).map((t) => (
                <div key={t.id} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '10px 12px',
                  marginBottom: 8,
                }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{t.title}</div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t.description}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                    {t.assignee ? `👤 ${t.assignee.name}` : 'Unassigned'}
                    {t.dueDate && <> · 📅 {t.dueDate}</>}
                  </div>
                  {isOwnerOrAdmin(project) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {status !== 'TODO' && (
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }}
                          onClick={() => handleStatusChange(t.id, status === 'IN_PROGRESS' ? 'TODO' : 'IN_PROGRESS')}>
                          ← Back
                        </button>
                      )}
                      {status !== 'DONE' && (
                        <button className="btn-outline" style={{ fontSize: 12, padding: '4px 8px' }}
                          onClick={() => handleStatusChange(t.id, status === 'TODO' ? 'IN_PROGRESS' : 'DONE')}>
                          Forward →
                        </button>
                      )}
                      <button className="btn-danger" style={{ fontSize: 12, padding: '4px 8px', marginLeft: 'auto' }}
                        onClick={() => handleDeleteTask(t.id)}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Team members section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Team Members</h2>
          {isOwnerOrAdmin(project) && addableUsers.length > 0 && (
            <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 13 }}
              onClick={() => setShowMemberForm(!showMemberForm)}>
              {showMemberForm ? 'Cancel' : '+ Add Member'}
            </button>
          )}
        </div>

        {showMemberForm && (
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <select value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} required style={{ flex: 1 }}>
              <option value="">— Select user —</option>
              {addableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <button className="btn-primary" type="submit" style={{ whiteSpace: 'nowrap' }}>Add</button>
          </form>
        )}

        {/* Owner row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#4f46e5', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
          }}>
            {project.owner?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{project.owner?.name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{project.owner?.email}</div>
          </div>
          <span className="badge badge-admin">Owner</span>
        </div>

        {/* Member rows */}
        {(project.members || []).map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#0369a1', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
            }}>
              {m.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.email}</div>
            </div>
            <span className="badge badge-member">Member</span>
            {isOwnerOrAdmin(project) && (
              <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }}
                onClick={() => handleRemoveMember(m.id)}>
                Remove
              </button>
            )}
          </div>
        ))}

        {(project.members || []).length === 0 && (
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>No additional members. Add team members above.</p>
        )}
      </div>
    </div>
  );
}
