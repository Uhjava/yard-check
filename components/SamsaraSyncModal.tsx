import React, { useState } from 'react';
import { fetchSamsaraLocations, getUnitsInYard } from '../services/samsaraService';
import { UnitStatus } from '../types';
import { X, Satellite, Loader2, Key, FlaskConical } from 'lucide-react';

interface SamsaraSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  yardName: string;
  onSyncComplete: (updates: { unitId: string, status: UnitStatus }[]) => void;
}

const SamsaraSyncModal: React.FC<SamsaraSyncModalProps> = ({ 
  isOpen, 
  onClose, 
  yardName, 
  onSyncComplete 
}) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const performSync = async (apiToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const vehicles = await fetchSamsaraLocations(apiToken);
      const foundUnitIds = getUnitsInYard(vehicles, yardName);
      
      const updates = foundUnitIds.map(id => ({
        unitId: id,
        status: UnitStatus.PRESENT
      }));

      onSyncComplete(updates);
      onClose();
    } catch (err) {
      setError("Failed to sync. Check your API Token and internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    performSync(token);
  };

  const handleSimulation = () => {
    // 'demo' is the trigger in the service to generate mock data
    performSync('demo');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Satellite size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Samsara GPS Sync</h2>
            <p className="text-sm text-slate-500">Auto-fill based on live vehicle location</p>
          </div>
        </div>

        <form onSubmit={handleSync} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    API Access Token
                </label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste your Samsara API Token"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && token ? (
                    <Loader2 className="animate-spin" size={18} />
                ) : (
                    <Satellite size={18} />
                )}
                <span>Sync with Samsara</span>
            </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or No API Access?</span>
            </div>
        </div>

        <button
            type="button"
            onClick={handleSimulation}
            disabled={loading}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border-2 border-slate-200 dashed"
        >
             {loading && !token ? (
                <Loader2 className="animate-spin" size={18} />
            ) : (
                <FlaskConical size={18} />
            )}
            <span>Simulate / Bypass API</span>
        </button>
        <p className="text-xs text-center text-slate-400 mt-2">
            Generates mock GPS data for existing units to test the geofence logic.
        </p>
      </div>
    </div>
  );
};

export default SamsaraSyncModal;