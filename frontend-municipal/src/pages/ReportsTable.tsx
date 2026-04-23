import { Search, Filter, MoreVertical, Eye, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'verified': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Verified</span>;
    case 'pending': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Pending</span>;
    case 'rejected': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Rejected</span>;
    default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{status}</span>;
  }
};

const ReportsTable: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    
    // Real-time subscription
    const channel = supabase
      .channel('reports-table-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Garbage Reports</h2>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Search ID, Zone..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
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
              <th className="px-6 py-4 font-semibold">Location</th>
              <th className="px-6 py-4 font-semibold">AI Match</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                  Loading reports from Supabase...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                  No reports found. New uploads will appear here in real-time.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-red-600 cursor-pointer hover:underline">{report.tracking_code}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(report.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-${(report.confidence || 0) > 0.9 ? 'green' : 'amber'}-500`} style={{ width: `${(report.confidence || 0) * 100}%` }}></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{Math.round((report.confidence || 0) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 uppercase font-medium">
                    {report.waste_type || "mixed"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="View Details">
                        <Eye size={18} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
        <p>Showing {reports.length} of {reports.length} live entries</p>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Previous</button>
          <button className="px-3 py-1 bg-red-50 border border-red-100 text-red-600 rounded font-medium">1</button>
          <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ReportsTable;
