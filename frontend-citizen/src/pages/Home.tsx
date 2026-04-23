import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, Sparkles, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-16 min-h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply"></div>

      <div className="text-center mb-10 max-w-lg z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white/80 shadow-sm mb-6 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold text-slate-700">AI-Powered Rapid Verification</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-slate-800 mb-6 leading-[1.15] tracking-tight">
          Keep <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-teal-600 to-green-600 bg-300% animate-gradient">Bangalore</span> Beautiful.
        </h1>
        <p className="text-lg text-slate-600 font-medium px-4">
          Spot an illegal dump? Snap a photo and let our AI handle the reporting instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm mb-12 z-10">
        <div className="glass-card p-5 rounded-3xl flex items-center gap-5 group">
          <div className="bg-green-50 p-3.5 rounded-2xl text-green-600 group-hover:scale-110 group-hover:bg-green-100 transition-all duration-300">
            <Camera size={26} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">1. Snap It</h3>
            <p className="text-sm font-medium text-slate-500">Capture the garbage dump</p>
          </div>
        </div>
        
        <div className="glass-card p-5 rounded-3xl flex items-center gap-5 group">
          <div className="bg-teal-50 p-3.5 rounded-2xl text-teal-600 group-hover:scale-110 group-hover:bg-teal-100 transition-all duration-300">
            <MapPin size={26} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">2. Auto-Locate</h3>
            <p className="text-sm font-medium text-slate-500">We fetch exact coordinates</p>
          </div>
        </div>
        
        <div className="glass-card p-5 rounded-3xl flex items-center gap-5 group">
          <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300">
            <Sparkles size={26} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">3. AI Verify</h3>
            <p className="text-sm font-medium text-slate-500">Fast tracking to BBMP</p>
          </div>
        </div>
      </div>

      <Link 
        to="/submit" 
        className="group relative w-full max-w-sm bg-slate-900 text-white py-4.5 px-6 rounded-2xl font-bold text-center text-lg overflow-hidden flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:shadow-green-500/20 transition-all duration-300 z-10 hover:-translate-y-1 ring-1 ring-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-teal-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <Camera size={22} className="relative z-10" />
        <span className="relative z-10">Report Garbage Now</span>
        <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
      </Link>
      
      <div className="mt-12 flex gap-10 text-center z-10 bg-white/40 backdrop-blur-sm px-8 py-5 rounded-3xl border border-white/60 shadow-sm">
        <div>
          <div className="text-3xl font-black text-slate-800 mb-1">12K+</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reports</div>
        </div>
        <div className="w-[1px] bg-slate-200"></div>
        <div>
          <div className="text-3xl font-black text-green-600 mb-1">8.5K</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cleaned</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
