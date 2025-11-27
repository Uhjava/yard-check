import React from 'react';
import { Unit, UnitStatus } from '../types';
import { Check, X, MapPin } from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  status: UnitStatus;
  onUpdateStatus: (id: string, status: UnitStatus) => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, status, onUpdateStatus }) => {
  const isPresent = status === UnitStatus.PRESENT;
  const isMissing = status === UnitStatus.MISSING;

  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-200 shadow-sm
      ${isPresent ? 'bg-green-50 border-green-500' : ''}
      ${isMissing ? 'bg-red-50 border-red-500' : ''}
      ${status === UnitStatus.PENDING ? 'bg-white border-slate-200' : ''}
    `}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{unit.id}</h3>
          <p className="text-sm font-medium text-slate-500">{unit.category}</p>
        </div>
        {unit.expectedLocation && (
          <div className="flex items-center space-x-1 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              <MapPin size={12} />
              <span>{unit.expectedLocation}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
          onClick={() => onUpdateStatus(unit.id, UnitStatus.MISSING)}
          className={`
            flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-bold text-sm transition-colors
            ${isMissing 
              ? 'bg-red-600 text-white shadow-inner' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600'}
          `}
        >
          <X size={18} />
          <span>Not Here</span>
        </button>

        <button
          onClick={() => onUpdateStatus(unit.id, UnitStatus.PRESENT)}
          className={`
            flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-bold text-sm transition-colors
            ${isPresent 
              ? 'bg-green-600 text-white shadow-inner' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-green-50 hover:text-green-600'}
          `}
        >
          <Check size={18} />
          <span>Present</span>
        </button>
      </div>
    </div>
  );
};

export default UnitCard;