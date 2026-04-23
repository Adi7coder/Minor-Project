import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, CheckCircle2, Clock, MapPin, CheckSquare, Sparkles } from 'lucide-react';

const Tracking: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchId, setSearchId] = useState(reportId || '');
  const [searched, setSearched] = useState(!!reportId);

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;
    
    setSearched(true);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/reports/citizen/${searchId}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        setError('Report not found. Please check your ID.');
      }
    } catch (err) {
      setError('Network error while fetching report.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (reportId) {
      handleSearch();
    }
  }, [reportId]);

  return (
    <div className="p-4 sm:p-6 w-full max-w-md mx-auto pt-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Track Report</h2>
        <p className="text-slate-500 font-medium mt-1">Enter your ID to check status</p>
      </div>
      
      <form onSubmit={handleSearch} className="relative mb-8 text-black group">
        <input 
          type="text" 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value.toUpperCase())}
          placeholder="e.g. GD-20250326"
          className="w-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl py-4.5 pl-5 pr-14 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 shadow-sm transition-all group-hover:shadow-md"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-xl hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50" disabled={isLoading}>
          <Search size={20} strokeWidth={2.5} />
        </button>
      </form>

      {searched && (
        <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 font-medium animate-pulse">Loading status...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 font-medium">{error}</div>
          ) : reportData ? (
            <>
              <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Sparkles size={12} className="text-green-500" /> Current Status
                  </p>
                  <h3 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 capitalize">{reportData.status}</h3>
                </div>
                {reportData.detection && (
                  <div className="bg-green-50/80 border border-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm shadow-green-100">
                    AI Match: {Math.round(reportData.detection.confidence * 100)}%
                  </div>
                )}
              </div>

          <div className="relative pl-7 space-y-8">
            {/* Timeline Line */}
            <div className="absolute left-[13px] top-3 bottom-8 w-0.5 bg-gradient-to-b from-green-500 via-green-200 to-slate-200 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="absolute -left-9 bg-white p-1 rounded-full shadow-sm ring-4 ring-white border border-slate-100">
                <CheckCircle2 size={24} className="text-green-500 fill-green-50" strokeWidth={2} />
              </div>
              <div className="-mt-1">
                <p className="font-bold text-slate-900 text-lg">Report Submitted</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Mar 26, 2025 • 10:30 AM</p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="absolute -left-9 bg-white p-1 rounded-full shadow-sm ring-4 ring-white border border-slate-100">
                <CheckCircle2 size={24} className="text-green-500 fill-green-50" strokeWidth={2} />
              </div>
              <div className="-mt-1">
                <p className="font-bold text-slate-900 text-lg">AI Verified</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Mar 26, 2025 • 10:31 AM</p>
              </div>
            </div>

            <div className="relative z-10 group">
              <div className="absolute -left-9 bg-white p-1 rounded-full shadow-md ring-4 ring-amber-50 border border-amber-100">
                <div className="relative">
                  <Clock size={24} className="text-amber-500 fill-amber-50 relative z-10" strokeWidth={2} />
                  <div className="absolute inset-0 bg-amber-400 blur hover:blur-xl rounded-full opacity-40 animate-pulse"></div>
                </div>
              </div>
              <div className="-mt-1 bg-amber-50/50 p-3 -mx-3 rounded-xl border border-amber-100/50">
                <p className="font-bold text-amber-900 text-lg">Pending Assignment</p>
                <p className="text-sm font-medium text-amber-700/70 mt-0.5">Awaiting BBMP Officer scheduling</p>
              </div>
            </div>
            
            <div className="relative z-10 opacity-30">
              <div className="absolute -left-9 bg-slate-50 p-1 rounded-full border border-slate-200">
                <CheckSquare size={24} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <div className="-mt-1">
                <p className="font-bold text-slate-800 text-lg">Resolved</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Pending physical clean-up</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-5 border-t border-slate-100 flex gap-3">
            <button className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm group">
              <MapPin size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              View on Map
            </button>
          </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Tracking;
