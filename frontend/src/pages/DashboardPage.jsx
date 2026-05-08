import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  ListTodo,
} from 'lucide-react';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: [user?.id, 'dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { summary, myTasks, projectStats } = data || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening across your projects.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Projects" value={summary?.totalProjects ?? 0} icon={FolderKanban} color="purple" />
        <StatCard label="Total Tasks" value={summary?.totalTasks ?? 0} icon={ListTodo} color="blue" />
        <StatCard label="In Progress" value={summary?.inProgressTasks ?? 0} icon={Clock} color="yellow" />
        <StatCard label="Completed" value={summary?.doneTasks ?? 0} icon={CheckCircle2} color="green" />
        <StatCard label="Overdue" value={summary?.overdueTasks ?? 0} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">My Open Tasks</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {myTasks?.length === 0 && (
                <p className="p-5 text-sm text-gray-500">No open tasks assigned to you.</p>
              )}
              {myTasks?.map((task) => {
                const overdue = task.dueDate && isPast(new Date(task.dueDate));
                return (
                  <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                      >
                        {task.title}
                      </Link>
                      <Link
                        to={`/projects/${task.project.id}`}
                        className="text-xs text-gray-500 hover:text-blue-500"
                      >
                        {task.project.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`badge ${STATUS_STYLES[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Project Progress</h2>
            </div>
            <div className="p-4 space-y-4">
              {projectStats?.length === 0 && (
                <p className="text-sm text-gray-500">No projects yet.</p>
              )}
              {projectStats?.map(({ project, progress, total, done, overdue, role }) => (
                  <div key={project.id}>
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                      >
                        {project.name}
                      </Link>
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{done}/{total} done</span>
                      {overdue > 0 && <span className="text-red-500">{overdue} overdue</span>}
                      <span className={`ml-auto badge ${
                        role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {role === 'ADMIN' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
