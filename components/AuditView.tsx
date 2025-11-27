
import React, { useState, useMemo, useRef } from 'react';
import { Unit, AuditSession, UnitStatus, Task } from '../types';
import { MOCK_UNITS, CATEGORIES } from '../constants';
import UnitCard from './UnitCard';
import { processAuditFile } from '../services/geminiService';
import ToDoList from './ToDoList';
import SamsaraSyncModal from './SamsaraSyncModal';
import { Search, Filter, ClipboardCheck, Upload, Loader2, Bell, Satellite } from 'lucide-react';

interface AuditViewProps {
  session: AuditSession;
  tasks: Task[];
  onUpdateRecord: (unitId: string, status: UnitStatus) => void;
  onBulkUpdateRecords: (updates: { unitId: string, status: UnitStatus }[]) => void;
  onComplete: () => void;
  // Task handlers
  onAddTask: (text: string, priority: 'high' | 'normal') => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const AuditView: React.FC<AuditViewProps> = ({ 
  session, 
  tasks,
  onUpdateRecord, 
  onBulkUpdateRecords, 
  onComplete,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Done'>('All');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isToDoOpen, setIsToDoOpen] = useState(false);
  const [isSamsaraModalOpen, setIsSamsaraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processedUnits = useMemo(() => {
    return MOCK_UNITS.filter(unit => {
      // Search
      const matchesSearch = unit.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            unit.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category
      const matchesCategory = selectedCategory === 'All' || unit.category === selectedCategory;

      // Status Filter
      const status = session.records[unit.id]?.status || UnitStatus.PENDING;
      let matchesStatus = true;
      if (filterStatus === 'Pending') matchesStatus = status === UnitStatus.PENDING;
      if (filterStatus === 'Done') matchesStatus = status !== UnitStatus.PENDING;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, filterStatus, session.records]);

  // Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      // Process file with Gemini
      const foundUnitIds = await processAuditFile(file, session.yard);
      
      // Prepare updates for units that exist in our system and match the found IDs
      const updates = foundUnitIds
        .filter(id => MOCK_UNITS.some(u => u.id === id)) // Only valid units
        .map(id => ({
          unitId: id,
          status: UnitStatus.PRESENT
        }));

      if (updates.length > 0) {
        onBulkUpdateRecords(updates);
        alert(`Auto-filled ${updates.length} units as PRESENT based on the uploaded file.`);
      } else {
        alert("No matching units found for this yard in the document.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to process file.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const handleSamsaraSync = (updates: { unitId: string, status: UnitStatus }[]) => {
      const validUpdates = updates.filter(u => MOCK_UNITS.some(m => m.id === u.unitId));
      if (validUpdates.length > 0) {
        onBulkUpdateRecords(validUpdates);
        alert(`Successfully synced ${validUpdates.length} units from Samsara GPS data.`);
      } else {
        alert("Synced with Samsara, but no matching units were found in this geofence.");
      }
  };

  // Calculate Progress
  const totalUnits = MOCK_UNITS.length;
  const auditedCount = Object.keys(session.records).length;
  const progressPercent = Math.round((auditedCount / totalUnits) * 100);

  // Alert Badge Count
  const pendingHighPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high').length;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <ToDoList 
        isOpen={isToDoOpen}
        onClose={() => setIsToDoOpen(false)}
        tasks={tasks}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
      />

      <SamsaraSyncModal 
        isOpen={isSamsaraModalOpen}
        onClose={() => setIsSamsaraModalOpen(false)}
        yardName={session.yard}
        onSyncComplete={handleSamsaraSync}
      />

      {/* Loading Overlay */}
      {isProcessingFile && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800">Analyzing Document...</h3>
            <p className="text-slate-500">Matching units to {session.yard} yard</p>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-start mb-3">
            <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                {session.yard} Audit
                </h2>
                <div className="text-xs font-semibold text-slate-500 mt-1">
                {auditedCount} / {totalUnits} Checked
                </div>
            </div>
            
            <div className="flex items-center space-x-2">
                {/* Alerts / Menu Button */}
                <button
                  onClick={() => setIsToDoOpen(true)}
                  className="relative p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 active:scale-95 transition-transform"
                >
                  <Bell size={18} />
                  {pendingHighPriorityTasks > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white">
                      {pendingHighPriorityTasks}
                    </span>
                  )}
                </button>

                {/* Samsara Button */}
                <button
                    onClick={() => setIsSamsaraModalOpen(true)}
                    className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold border border-blue-100 active:scale-95 transition-transform"
                >
                    <Satellite size={14} />
                    <span className="hidden sm:inline">Sync GPS</span>
                    <span className="sm:hidden">GPS</span>
                </button>

                {/* Auto-fill Button */}
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingFile}
                        className="flex items-center space-x-1 bg-brand-50 text-brand-700 px-3 py-2 rounded-lg text-xs font-bold border border-brand-100 active:scale-95 transition-transform"
                    >
                        <Upload size={14} />
                        <span className="hidden sm:inline">Scan Doc</span>
                        <span className="sm:hidden">Scan</span>
                    </button>
                </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
            <div 
              className="bg-brand-600 h-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Unit ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filters Scrollable */}
        <div className="flex overflow-x-auto px-4 pb-3 space-x-2 no-scrollbar">
           <button
            onClick={() => setSelectedCategory('All')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              selectedCategory === 'All' 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            All Types
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                selectedCategory === cat 
                  ? 'bg-brand-600 text-white border-brand-600' 
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Status Toggles */}
        <div className="flex px-4 pb-2 border-t border-slate-100 pt-2 space-x-4 text-xs font-semibold text-slate-500">
             <button onClick={() => setFilterStatus('All')} className={filterStatus === 'All' ? 'text-brand-600' : ''}>All</button>
             <button onClick={() => setFilterStatus('Pending')} className={filterStatus === 'Pending' ? 'text-brand-600' : ''}>Pending</button>
             <button onClick={() => setFilterStatus('Done')} className={filterStatus === 'Done' ? 'text-brand-600' : ''}>Done</button>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {processedUnits.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <Filter className="mx-auto mb-2" size={32} />
            <p>No units match your filter.</p>
          </div>
        ) : (
          processedUnits.map(unit => (
            <UnitCard 
              key={unit.id} 
              unit={unit} 
              status={session.records[unit.id]?.status || UnitStatus.PENDING}
              onUpdateStatus={onUpdateRecord}
            />
          ))
        )}
      </div>

      {/* Floating Complete Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-30">
        <button 
          onClick={onComplete}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform"
        >
          <ClipboardCheck size={20} />
          <span>Finish Audit & Review</span>
        </button>
      </div>
    </div>
  );
};

export default AuditView;