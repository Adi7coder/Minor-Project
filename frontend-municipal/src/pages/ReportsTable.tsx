import React from 'react';
import { Search, Filter, MoreVertical, Eye, MapPin } from 'lucide-react';

const mockReports = [
  { id: 'GD-20250326-A1B2C', date: '2025-03-26 10:30', zone: 'South Zone', confidence: 0.95, status: 'pending', assigned: null },
  { id: 'GD-20250326-D4E5F', date: '2025-03-26 09:15', zone: 'East Zone', confidence: 0.88, status: 'in_progress', assigned: 'Officer Raj' },
  { id: 'GD-20250325-G7H8I', date: '2025-03-25 16:40', zone: 'Koramangala', confidence: 0.72, status: 'manual_review', assigned: null },
  { id: 'GD-20250324-J0K1L', date: '2025-03-24 11:20', zone: 'West Zone', confidence: 0.98, status: 'resolved', assigned: 'Officer Kumar' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">Pending</span>;
    case 'in_progress': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">In Progress</span>;
    case 'resolved': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">Resolved</span>;
    case 'manual_review': return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">Review Required</span>;
    default: return null;
  }
};

const ReportsTable: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Garbage Reports</h2>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Search ID, Zone..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Report ID</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Location / Zone</th>
              <th className="px-6 py-4 font-semibold">AI Match</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Assigned To</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockReports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">{report.id}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{report.date}</td>
                <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  {report.zone}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-${report.confidence > 0.9 ? 'green' : 'amber'}-500`} style={{ width: `${report.confidence * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{Math.round(report.confidence * 100)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {report.assigned ? (
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {report.assigned.charAt(0)}
                      </div>
                      {report.assigned}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="View Details">
                      <Eye size={18} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
        <p>Showing 1 to 4 of 1,234 entries</p>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Prevent</button>
          <button className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded font-medium">1</button>
          <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">2</button>
          <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">3</button>
          <span className="px-2 py-1">...</span>
          <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ReportsTable;
