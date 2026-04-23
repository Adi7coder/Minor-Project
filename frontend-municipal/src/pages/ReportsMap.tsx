import React from 'react';

const ReportsMap: React.FC = () => {
  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative w-full">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-xl shadow-lg border border-slate-100 w-64 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Map Filters</h3>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" defaultChecked className="rounded text-red-600 focus:ring-red-500" />
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block align-middle mr-1"></span>
          Pending
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" defaultChecked className="rounded text-red-600 focus:ring-red-500" />
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block align-middle mr-1"></span>
          In Progress
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="rounded text-red-600 focus:ring-red-500" />
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block align-middle mr-1"></span>
          Resolved
        </label>
      </div>
      
      {/* Map placeholder since Leaflet/GoogleMaps isn't fully integrated here */}
      <div className="w-full h-full bg-slate-100 flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        <div className="text-center z-10">
          <p className="text-slate-500 font-medium mb-2">Map Integration Placeholder</p>
          <p className="text-sm text-slate-400 max-w-sm">
            In production, this would initialize Mapbox GL JS or Google Maps API, clustering markers using Supercluster and displaying bounding boxes dynamically.
          </p>
        </div>
        
        {/* Mock Map Marker */}
        <div className="absolute top-[40%] left-[50%] flex flex-col items-center group cursor-pointer">
          <div className="bg-white p-2 border border-slate-200 shadow-xl rounded-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full w-48 pointer-events-none">
            <p className="text-xs font-bold text-slate-800">GD-20250326-ABCDE</p>
            <p className="text-[10px] text-slate-500">Confidence: 95%</p>
            <img src="https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&q=80&w=200&h=120" className="mt-2 rounded h-20 w-full object-cover" />
          </div>
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md animate-bounce relative z-20"></div>
        </div>
      </div>
    </div>
  );
};

export default ReportsMap;
