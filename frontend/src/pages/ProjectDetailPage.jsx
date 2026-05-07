import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Users,
  ArrowLeft,
  UserPlus,
  Trash2,
  Crown,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_COLORS = {
  TODO: 'border-gray-300',
  IN_PROGRESS: 'border-blue-400',
  DONE: 'border-green-400',
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '',
  });
  const [memberEmail, setMemberEmail] = useState('');

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [user?.id, 'project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: [user?.id, 'tasks', projectId, filterStatus, filterPriority],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      return api.get(`/tasks/project/${projectId}?${params}`).then((r) => r.data);
    },
  });

  const isAdmin = project?.myRole === 'ADMIN';

  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post(`/tasks/project/${projectId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [user?.id, 'tasks', projectId] });
      qc.invalidateQueries({ queryKey: [user?.id, 'dashboard'] });
      setShowAddTask(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      toast.success('Task created');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create task'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => api.put(`/tasks/${taskId}`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [user?.id, 'tasks', projectId] });
      qc.invalidateQueries({ queryKey: [user?.id, 'dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update task'),
  });

  const addMemberMutation = useMutation({
    mutationFn: (email) => api.post(`/projects/${projectId}/members`, { email }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [user?.id, 'project', projectId] });
      setMemberEmail('');
      setShowAddMember(false);
      toast.success('Member added');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add member'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [user?.id, 'project', projectId] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to remove member'),
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    const data = { ...taskForm };
    if (!data.dueDate) delete data.dueDate;
    if (!data.assigneeId) delete data.assigneeId;
    createTaskMutation.mutate(data);
  };

  if (projectLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Project not found.</p>
        <Link to="/projects" className="btn-primary mt-4 inline-flex">Back to projects</Link>
      </div>
    );
  }

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-500 mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowMembers(true)} className="btn-secondary">
              <Users className="w-4 h-4" />
              {project.members?.length} members
            </button>
            {isAdmin && (
              <>
                <button onClick={() => setShowAddMember(true)} className="btn-secondary">
                  <UserPlus className="w-4 h-4" />
                  Add member
                </button>
                <button onClick={() => setShowAddTask(true)} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Add task
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        {(filterStatus || filterPriority) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterPriority(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {tasksLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUSES.map((status) => (
            <div key={status}>
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${STATUS_COLORS[status]}`}>
                <h3 className="font-semibold text-gray-700">{STATUS_LABELS[status]}</h3>
                <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {tasksByStatus[status].length}
                </span>
              </div>
              <div className="space-y-3">
                {tasksByStatus[status].length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No tasks</p>
                )}
                {tasksByStatus[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canEdit={true}
                    onStatusChange={(taskId, newStatus) =>
                      updateTaskMutation.mutate({ taskId, status: newStatus })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              className="input"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Optional description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="input"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                className="input"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
            <select
              className="input"
              value={taskForm.assigneeId}
              onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {project.members?.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Creating…' : 'Create task'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMemberMutation.mutate(memberEmail);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              className="input"
              placeholder="colleague@example.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">The user must already have an account.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Adding…' : 'Add member'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showMembers} onClose={() => setShowMembers(false)} title="Team Members">
        <div className="space-y-3">
          {project.members?.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                <p className="text-xs text-gray-500">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.role === 'ADMIN' && <Crown className="w-4 h-4 text-yellow-500" />}
                <span className={`badge ${m.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {m.role}
                </span>
                {isAdmin && m.user.id !== user.id && m.user.id !== project.ownerId && (
                  <button
                    onClick={() => removeMemberMutation.mutate(m.user.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
