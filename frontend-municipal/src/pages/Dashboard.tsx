import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    avgRes: '000'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Real-time subscription to see new uploads instantly
    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data, count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact' });

      if (error) throw error;

      if (data) {
        const verified = data.filter(r => r.status === 'verified').length;
        const pending = data.filter(r => r.status === 'pending').length;
        setStats({
          total: count || 0,
          verified: verified,
          pending: pending,
          avgRes: '000' // Setting to 000 as requested
        });
      }
    } catch (err) {
      console.error("Error fetching Supabase stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const emptyDailyTrend = [
    { name: 'Mon', reports: 0, cleaned: 0 },
    { name: 'Tue', reports: 0, cleaned: 0 },
    { name: 'Wed', reports: 0, cleaned: 0 },
    { name: 'Thu', reports: 0, cleaned: 0 },
    { name: 'Fri', reports: 0, cleaned: 0 },
    { name: 'Sat', reports: 0, cleaned: 0 },
    { name: 'Sun', reports: 0, cleaned: 0 },
  ];

  const emptyZoneStats = [
    { name: 'South', value: 0 },
    { name: 'East', value: 0 },
    { name: 'West', value: 0 },
    { name: 'North', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
        <div className="flex items-center gap-3">
           {isLoading && <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>}
           <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Reports</p>
            <h3 className="text-3xl font-bold text-slate-800">{isLoading ? "---" : stats.total || "000"}</h3>
            <p className="text-xs font-medium text-green-600 mt-2">Live from Supabase</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
            <Trash2 size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">AI Verified</p>
            <h3 className="text-3xl font-bold text-slate-800">{isLoading ? "---" : stats.verified || "000"}</h3>
            <p className="text-xs font-medium text-green-600 mt-2">Accurate Detections</p>
          </div>
          <div className="bg-red-50 p-3 rounded-full text-red-600">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending Cleanup</p>
            <h3 className="text-3xl font-bold text-slate-800">{isLoading ? "---" : stats.pending || "000"}</h3>
            <p className="text-xs font-medium text-red-500 mt-2">Awaiting Action</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-full text-amber-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Avg Resolution</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.avgRes}</h3>
            <p className="text-xs font-medium text-slate-400 mt-2">No historical data</p>
          </div>
          <div className="bg-green-50 p-3 rounded-full text-green-600">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Daily Submissions vs Cleanups</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={emptyDailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="cleaned" stroke="#48bb78" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Reports by Zone</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emptyZoneStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 500 }} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
