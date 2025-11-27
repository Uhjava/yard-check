import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AuditSession, UnitStatus } from '../types';
import { MOCK_UNITS } from '../constants';
import { generateAuditReport } from '../services/geminiService';
import { CheckCircle, AlertTriangle, Sparkles, ArrowLeft, Share2 } from 'lucide-react';

interface ReportViewProps {
  session: AuditSession;
  onBack: () => void;
  onReset: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ session, onBack, onReset }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Stats
  const totalChecked = Object.keys(session.records).length;
  const presentCount = Object.values(session.records).filter(r => r.status === UnitStatus.PRESENT).length;
  const missingCount = Object.values(session.records).filter(r => r.status === UnitStatus.MISSING).length;
  
  const handleGenerateAiReport = async () => {
    setLoadingAi(true);
    const report = await generateAuditReport(session);
    setAiReport(report);
    setLoadingAi(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800">
            <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg">Audit Summary</h1>
        <div className="w-6"></div> {/* Spacer */}
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="text-green-500 bg-green-50 p-3 rounded-full mb-2">
                <CheckCircle size={24} />
            </div>
            <span className="text-3xl font-bold text-slate-800">{presentCount}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Found</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="text-red-500 bg-red-50 p-3 rounded-full mb-2">
                <AlertTriangle size={24} />
            </div>
            <span className="text-3xl font-bold text-slate-800">{missingCount}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Missing</span>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden">
            <div className="bg-brand-50 px-4 py-3 border-b border-brand-100 flex justify-between items-center">
                <h3 className="font-bold text-brand-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-brand-500" />
                    AI Analysis
                </h3>
            </div>
            
            <div className="p-4">
                {!aiReport && !loadingAi && (
                    <div className="text-center py-6">
                        <p className="text-slate-500 text-sm mb-4">
                            Generate a professional summary of missing units and inventory health using Gemini.
                        </p>
                        <button 
                            onClick={handleGenerateAiReport}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
                        >
                            <Sparkles size={16} />
                            Generate Report
                        </button>
                    </div>
                )}

                {loadingAi && (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400 animate-pulse">
                        <div className="h-2 w-24 bg-slate-200 rounded mb-2"></div>
                        <div className="h-2 w-32 bg-slate-200 rounded"></div>
                        <span className="mt-4 text-xs">Consulting Gemini...</span>
                    </div>
                )}

                {aiReport && (
                    <div className="prose prose-sm prose-slate max-w-none">
                        <ReactMarkdown>{aiReport}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>

        {/* Missing Units List (Raw) */}
        {missingCount > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm">Missing Units Log</h3>
                </div>
                <ul className="divide-y divide-slate-100">
                    {Object.values(session.records)
                        .filter(r => r.status === UnitStatus.MISSING)
                        .map(record => {
                            const unit = MOCK_UNITS.find(u => u.id === record.unitId);
                            return (
                                <li key={record.unitId} className="px-4 py-3 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-slate-800">{record.unitId}</div>
                                        <div className="text-xs text-slate-500">{unit?.category}</div>
                                    </div>
                                    <div className="text-xs font-mono bg-red-50 text-red-600 px-2 py-1 rounded">
                                        Last: {unit?.expectedLocation}
                                    </div>
                                </li>
                            );
                        })}
                </ul>
            </div>
        )}

      </div>
        
      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
        <button 
            onClick={onReset}
            className="w-full py-3 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
        >
            Start New Audit
        </button>
      </div>
    </div>
  );
};

export default ReportView;