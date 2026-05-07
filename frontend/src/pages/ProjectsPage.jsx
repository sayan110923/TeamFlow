import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderKanban, Users, CheckSquare, Trash2, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

function getRoleBadge(project, userId) {
  if (project.owner?.id === userId) {
    return { label: 'Owner', className: 'bg-purple-100 text-purple-700' };
  }
  if (project.myRole === 'ADMIN') {
    return { label: 'Admin', className: 'bg-blue-100 text-blue-700' };
  }
  return { label: 'Member', className: 'bg-gray-100 text-gray-600' };
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: [user?.id, 'projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/projects', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [user?.id, 'projects'] });
      qc.invalidateQueries({ queryKey: [user?.id, 'dashboard'] });
      setShowCreate(false);
      setForm({ name: '', description: '' });
      toast.success('Project created');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create project'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [user?.id, 'projects'] });
      qc.invalidateQueries({ queryKey: [user?.id, 'dashboard'] });
      toast.success('Project deleted');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete project'),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" />
            Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const badge = getRoleBadge(project, user?.id);
            const isOwner = project.owner?.id === user?.id;
            return (
              <div key={project.id} className="card p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-base font-semibold text-gray-900 hover:text-blue-600 block truncate"
                    >
                      {project.name}
                    </Link>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this project and all its tasks?')) {
                          deleteMutation.mutate(project.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" />
                    {project._count?.tasks ?? 0} tasks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {project._count?.members ?? 0} members
                  </span>
                  <span className={`ml-auto badge flex items-center gap-1 ${badge.className}`}>
                    {isOwner && <Crown className="w-3 h-3" />}
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project name *</label>
            <input
              className="input"
              placeholder="My awesome project"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
