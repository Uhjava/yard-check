
import React, { useState } from 'react';
import { Task } from '../types';
import { X, Plus, Trash2, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface ToDoListProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (text: string, priority: 'high' | 'normal') => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const ToDoList: React.FC<ToDoListProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask 
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText, isHighPriority ? 'high' : 'normal');
    setNewTaskText('');
    setIsHighPriority(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <AlertCircle className="text-brand-600" size={20} />
            Alerts & To-Dos
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAdd} className="p-4 border-b border-slate-100 bg-white">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button 
              type="submit"
              className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHighPriority(!isHighPriority)}
              className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${
                isHighPriority 
                  ? 'bg-red-50 border-red-200 text-red-600 font-bold' 
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <AlertCircle size={12} />
              High Priority
            </button>
          </div>
        </form>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No active tasks</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  task.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <button 
                  onClick={() => onToggleTask(task.id)}
                  className={`mt-0.5 ${task.completed ? 'text-slate-400' : 'text-brand-600'}`}
                >
                  {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {task.text}
                  </p>
                  {task.priority === 'high' && !task.completed && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      High Priority
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}

          {/* Dancing GIF */}
          <div className="flex justify-center mt-6 pb-2">
            <img 
              src="https://media1.tenor.com/m/mXkSpkrmEw8AAAAC/shikanoko-nokonoko.gif" 
              alt="Shikanoko Nokonoko Dancing" 
              className="h-32 rounded-lg shadow-sm opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
          {tasks.filter(t => !t.completed).length} pending tasks
        </div>
      </div>
    </div>
  );
};

export default ToDoList;
