import { Link } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { Calendar, User, AlertCircle } from 'lucide-react';

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

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export default function TaskCard({ task, onStatusChange, canEdit }) {
  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to={`/tasks/${task.id}`}
          className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
        >
          {task.title}
        </Link>
        <span className={`badge ${PRIORITY_STYLES[task.priority]} shrink-0`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {canEdit ? (
            <select
              value={task.status}
              onChange={(e) => onStatusChange?.(task.id, e.target.value)}
              className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_STYLES[task.status]}`}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          ) : (
            <span className={`badge ${STATUS_STYLES[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {task.assignee && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignee.name}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 ${
                isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-600' : ''
              }`}
            >
              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
