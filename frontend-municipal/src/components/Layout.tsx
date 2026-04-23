import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, List, LogOut, Bell } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/map', icon: <Map size={20} />, label: 'Map View' },
    { path: '/reports', icon: <List size={20} />, label: 'Reports' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <span className="text-white text-sm font-black">CB</span>
          </div>
          CleanBLR
        </h1>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-red-600/10 text-red-400 font-medium' 
                  : 'hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-red-400' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl w-full hover:bg-slate-800/50 hover:text-white transition-all text-left">
          <LogOut size={20} className="text-slate-400" />
          Logout
        </button>
      </div>
    </aside>
  );
};

const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 w-full ml-64" style={{ width: 'calc(100% - 16rem)' }}>
      <div className="text-slate-800 font-medium">
        Municipal Operations
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 leading-tight">Admin User</p>
            <p className="text-xs text-slate-500">BBMP Official</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64" style={{ width: 'calc(100% - 16rem)' }}>
        <Header />
        <main className="flex-1 p-8 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
