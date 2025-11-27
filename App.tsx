
import React, { useState, useEffect } from 'react';
import { AuditSession, YardLocation, UnitStatus, Task } from './types';
import { YARDS } from './constants';
import AuditView from './components/AuditView';
import ReportView from './components/ReportView';
import { Truck, Navigation, ChevronRight } from 'lucide-react';

type AppState = 'HOME' | 'AUDIT' | 'REPORT';

function App() {
  const [view, setView] = useState<AppState>('HOME');
  const [session, setSession] = useState<AuditSession | null>(null);
  
  // Task State
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Verify maintenance logs for GHM 08-02', completed: false, priority: 'high', createdAt: Date.now() },
    { id: '2', text: 'Check tire pressure on Camera Trucks', completed: false, priority: 'normal', createdAt: Date.now() }
  ]);

  // Initialize a new session
  const startSession = (yard: YardLocation) => {
    const newSession: AuditSession = {
      id: Date.now().toString(),
      yard,
      startTime: Date.now(),
      records: {},
      completed: false,
    };
    setSession(newSession);
    setView('AUDIT');
  };

  // Update a specific unit's status
  const updateRecord = (unitId: string, status: UnitStatus) => {
    if (!session) return;
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        records: {
          ...prev.records,
          [unitId]: {
            unitId,
            status,
            timestamp: Date.now()
          }
        }
      };
    });
  };

  // Bulk update records (e.g., from file upload)
  const bulkUpdateRecords = (updates: { unitId: string, status: UnitStatus }[]) => {
    if (!session) return;
    setSession(prev => {
      if (!prev) return null;
      const newRecords = { ...prev.records };
      updates.forEach(({ unitId, status }) => {
        newRecords[unitId] = {
          unitId,
          status,
          timestamp: Date.now()
        };
      });
      return {
        ...prev,
        records: newRecords
      };
    });
  };

  // Task Handlers
  const addTask = (text: string, priority: 'high' | 'normal') => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      priority,
      completed: false,
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Complete the audit
  const completeAudit = () => {
    if (!session) return;
    setSession(prev => prev ? ({ ...prev, completed: true }) : null);
    setView('REPORT');
  };

  // Reset
  const resetApp = () => {
    setSession(null);
    setView('HOME');
  };

  // Render Home Screen
  if (view === 'HOME') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20"></div>

        <div className="z-10 w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-4 bg-brand-500 rounded-2xl shadow-xl mb-4">
              <Truck size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">YardCheck AI</h1>
            <p className="text-slate-400 text-lg">Fleet Inventory Manager</p>
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-4">Select Location to Start</p>
            {YARDS.map(yard => (
              <button
                key={yard}
                onClick={() => startSession(yard)}
                className="group w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center justify-between transition-all active:scale-95"
              >
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400 group-hover:text-white transition-colors">
                        <Navigation size={24} />
                    </div>
                    <span className="text-xl font-bold text-white">{yard}</span>
                </div>
                <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 text-slate-600 text-xs">
          v1.0.0 • Authorized Personnel Only
        </div>
      </div>
    );
  }

  // Render Audit Screen
  if (view === 'AUDIT' && session) {
    return (
      <AuditView 
        session={session} 
        tasks={tasks}
        onUpdateRecord={updateRecord}
        onBulkUpdateRecords={bulkUpdateRecords}
        onComplete={completeAudit} 
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
      />
    );
  }

  // Render Report Screen
  if (view === 'REPORT' && session) {
    return (
      <ReportView 
        session={session} 
        onBack={() => setView('AUDIT')} 
        onReset={resetApp} 
      />
    );
  }

  return null;
}

export default App;
