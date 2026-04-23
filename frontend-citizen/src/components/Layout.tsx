import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trash2, Home, Search, MapPin } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <header className="sticky top-0 z-50 glass border-b border-white/50">
        <div className="max-w-screen-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-slate-800 font-extrabold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-tr from-green-500 to-teal-600 p-2 rounded-xl text-white shadow-md shadow-green-500/20">
              <Trash2 size={20} strokeWidth={2.5} />
            </div>
            Clean<span className="text-green-600">BLR</span>
          </Link>
          <div className="text-xs font-bold px-3 py-1.5 bg-green-50/80 border border-green-200 text-green-700 rounded-full flex items-center gap-2 shadow-sm rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Online
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-md mx-auto relative pb-28 sm:pb-8">
        {children}
      </main>

      <nav className="sm:hidden fixed bottom-6 left-4 right-4 glass-card z-50 rounded-[2rem] px-2 py-2 border-white/60">
        <div className="flex justify-around items-center h-14 relative">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center w-full h-full rounded-2xl transition-all duration-300 ${isActive('/') ? 'text-green-600 bg-green-50/50' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`transition-transform duration-300 ${isActive('/') ? '-translate-y-1' : ''}`}>
              <Home size={22} className={isActive('/') ? 'fill-green-100 stroke-green-600 stroke-2' : 'stroke-[1.5px]'} />
            </div>
            <span className={`text-[10px] font-bold mt-1 transition-opacity duration-300 ${isActive('/') ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>Home</span>
          </Link>
          
          <div className="relative -top-6 flex justify-center w-full">
            <Link 
              to="/submit" 
              className="bg-gradient-to-tr from-green-500 to-teal-600 text-white p-4 rounded-full shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 ring-4 ring-white/50"
            >
              <MapPin size={26} strokeWidth={2.5} />
            </Link>
          </div>
          
          <Link 
            to="/track" 
            className={`flex flex-col items-center justify-center w-full h-full rounded-2xl transition-all duration-300 ${isActive('/track') ? 'text-green-600 bg-green-50/50' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <div className={`transition-transform duration-300 ${isActive('/track') ? '-translate-y-1' : ''}`}>
              <Search size={22} className={isActive('/track') ? 'stroke-green-600 stroke-[2.5px]' : 'stroke-[1.5px]'} />
            </div>
            <span className={`text-[10px] font-bold mt-1 transition-opacity duration-300 ${isActive('/track') ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>Track</span>
          </Link>
        </div>
      </nav>
      
      {/* Desktop Footer */}
      <footer className="hidden sm:block mt-auto glass border-t border-white/50 py-8">
        <div className="max-w-screen-md mx-auto px-4 text-center text-sm font-medium text-slate-500">
          CleanBLR Citizen Portal © {new Date().getFullYear()}. Crafted for a cleaner Bangalore.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
