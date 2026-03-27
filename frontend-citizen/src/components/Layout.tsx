import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trash2, Home, Search, MapPin } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#667eea] font-bold text-xl tracking-tight">
            <div className="bg-gradient-to-tr from-[#667eea] to-[#764ba2] p-2 rounded-xl text-white">
              <Trash2 size={20} strokeWidth={2.5} />
            </div>
            CleanBLR
          </Link>
          <div className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Online
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-md mx-auto relative pb-20 sm:pb-8">
        {children}
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-[#667eea]' : 'text-slate-500 hover:text-slate-900'}`}>
            <Home size={22} className={isActive('/') ? 'fill-current' : ''} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <div className="relative -top-5 flex justify-center w-full">
            <Link to="/submit" className="bg-gradient-to-tr from-[#667eea] to-[#764ba2] text-white p-4 rounded-full shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all">
              <MapPin size={24} />
            </Link>
          </div>
          <Link to="/track" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/track') ? 'text-[#667eea]' : 'text-slate-500 hover:text-slate-900'}`}>
            <Search size={22} className={isActive('/track') ? 'stroke-[2.5px]' : ''} />
            <span className="text-[10px] font-medium">Track</span>
          </Link>
        </div>
      </nav>
      
      {/* Desktop Footer */}
      <footer className="hidden sm:block mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-screen-md mx-auto px-4 text-center text-sm text-slate-500">
          CleanBLR Citizen Portal © {new Date().getFullYear()} 
        </div>
      </footer>
    </div>
  );
};

export default Layout;
