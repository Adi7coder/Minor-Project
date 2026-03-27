import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, CheckCircle2, Clock, MapPin, CheckSquare } from 'lucide-react';

const Tracking: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchId, setSearchId] = useState(reportId || '');
  const [searched, setSearched] = useState(!!reportId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) setSearched(true);
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Track Report</h2>
      
      <form onSubmit={handleSearch} className="relative mb-8 text-black">
        <input 
          type="text" 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value.toUpperCase())}
          placeholder="e.g. GD-20250326-ABCDE"
          className="w-full bg-white border border-slate-300 rounded-2xl py-4 pl-4 pr-12 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent placeholder-slate-400 shadow-sm"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#667eea] text-white rounded-xl hover:bg-indigo-600 transition-colors">
          <Search size={20} />
        </button>
      </form>

      {searched && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-6 border-b pb-4">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Status</p>
              <h3 className="text-xl font-bold tracking-tight text-[#667eea]">Verified</h3>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
              AI: 95% Match
            </div>
          </div>

          <div className="relative pl-6 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-6 w-0.5 bg-slate-200"></div>
            
            <div className="relative z-10">
              <div className="absolute -left-6 bg-white p-0.5 rounded-full">
                <CheckCircle2 size={22} className="text-green-500 fill-green-100" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Report Submitted</p>
                <p className="text-sm text-slate-500">Mar 26, 2025 • 10:30 AM</p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="absolute -left-6 bg-white p-0.5 rounded-full">
                <CheckCircle2 size={22} className="text-green-500 fill-green-100" />
              </div>
              <div>
                <p className="font-bold text-slate-900">AI Verified</p>
                <p className="text-sm text-slate-500">Mar 26, 2025 • 10:31 AM</p>
              </div>
            </div>

            <div className="relative z-10">
              <div className="absolute -left-6 bg-white p-0.5 rounded-full">
                <Clock size={22} className="text-amber-500 fill-amber-100" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Pending Assignment</p>
                <p className="text-sm text-slate-500">Awaiting BBMP Officer</p>
              </div>
            </div>
            
            <div className="relative z-10 opacity-40">
              <div className="absolute -left-6 bg-white p-0.5 rounded-full">
                <CheckSquare size={22} className="text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Resolved</p>
                <p className="text-sm text-slate-500">Pending clean-up</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t flex gap-2">
            <button className="flex-1 bg-slate-100 text-slate-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
              <MapPin size={18} />
              View Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracking;
