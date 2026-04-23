import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';

const mockDailyTrend = [
  { name: 'Mon', reports: 40, cleaned: 24 },
  { name: 'Tue', reports: 30, cleaned: 13 },
  { name: 'Wed', reports: 20, cleaned: 38 },
  { name: 'Thu', reports: 27, cleaned: 39 },
  { name: 'Fri', reports: 18, cleaned: 48 },
  { name: 'Sat', reports: 23, cleaned: 38 },
  { name: 'Sun', reports: 34, cleaned: 43 },
];

const mockZoneStats = [
  { name: 'South', value: 400 },
  { name: 'East', value: 300 },
  { name: 'West', value: 300 },
  { name: 'North', value: 200 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
        <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2.5">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Month</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Reports</p>
            <h3 className="text-3xl font-bold text-slate-800">1,234</h3>
            <p className="text-xs font-medium text-green-600 mt-2">↑ 12% from last week</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
            <Trash2 size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">AI Verified</p>
            <h3 className="text-3xl font-bold text-slate-800">1,050</h3>
            <p className="text-xs font-medium text-green-600 mt-2">85.1% accuracy rate</p>
          </div>
          <div className="bg-red-50 p-3 rounded-full text-red-600">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending Cleanup</p>
            <h3 className="text-3xl font-bold text-slate-800">84</h3>
            <p className="text-xs font-medium text-red-500 mt-2">12 exceeding 48hrs</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-full text-amber-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Avg Resolution</p>
            <h3 className="text-3xl font-bold text-slate-800">18.5h</h3>
            <p className="text-xs font-medium text-green-600 mt-2">↓ 2.5h improvement</p>
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
              <LineChart data={mockDailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
              <BarChart data={mockZoneStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
