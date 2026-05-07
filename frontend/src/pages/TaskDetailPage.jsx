import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Flag, Trash2, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const { data: task, isLoading } = useQuery({
    queryKey: [user?.id, 'task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then((r) => r.data),
    onSuccess: (data) => {
      if (!form) {
        setForm({
          title: data.title,
          description: data.description || '',
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
          assigneeId: data.assigneeId || '',
        });
      }
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: [user?.id, 'members', task?.project?.id],
    queryFn: () => api.get(`/projects/${task.project.id}/members`).then((r) => r.data),
    enabled: !!task?.project?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/tasks/${taskId}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData([user?.id, 'task', taskId], updated);
      qc.invalidateQueries({ queryKey: [user?.id, 'tasks'] });
      qc.invalidateQueries({ queryKey: [user?.id, 'dashboard'] });
      setEditing(false);
      toast.success('Task updated');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [user?.id, 'tasks'] });
      qc.invalidateQueries({ queryKey: [user?.id, 'dashboard'] });
      toast.success('Task deleted');
      navigate(`/projects/${task.project.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete task'),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!task) {
    return <div className="p-8 text-center text-gray-500">Task not found.</div>;
  }

  const myMembership = members.find((m) => m.user.id === user.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  const handleSave = () => {
    const data = { ...form };
    if (!data.dueDate) data.dueDate = null;
    if (!data.assigneeId) data.assigneeId = null;
    updateMutation.mutate(data);
  };

  const startEdit = () => {
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setEditing(true);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        to={`/projects/${task.project.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {task.project.name}
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          {editing ? (
            <input
              className="input text-xl font-bold flex-1"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          ) : (
            <h1 className="text-xl font-bold text-gray-900 flex-1">{task.title}</h1>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={handleSave} className="btn-primary" disabled={updateMutation.isPending}>
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit} className="btn-secondary">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this task?')) deleteMutation.mutate();
                    }}
                    className="btn-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
            {editing ? (
              <select
                className="input mt-1"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            ) : (
              <div className="mt-1">
                <span className={`badge ${STATUS_STYLES[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</label>
            {editing && isAdmin ? (
              <select
                className="input mt-1"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            ) : (
              <div className="mt-1">
                <span className={`badge ${PRIORITY_STYLES[task.priority]}`}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignee</label>
            {editing && isAdmin ? (
              <select
                className="input mt-1"
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                {task.assignee?.name || 'Unassigned'}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due date</label>
            {editing && isAdmin ? (
              <input
                type="date"
                className="input mt-1"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            ) : (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
          {editing ? (
            <textarea
              className="input mt-1 resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add a description…"
            />
          ) : (
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
              {task.description || <span className="text-gray-400 italic">No description</span>}
            </p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Created by {task.creator?.name}</span>
          <span>Updated {format(new Date(task.updatedAt), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
