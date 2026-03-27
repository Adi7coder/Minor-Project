import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-8rem)]">
      <div className="text-center mb-8 max-w-md">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Help Keep <span className="text-[#667eea] bg-indigo-50 px-2 rounded-lg">Bangalore</span> Clean
        </h1>
        <p className="text-lg text-slate-600">
          Spot an illegal garbage dump? Report it instantly using our AI-powered platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm mb-10">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <Camera size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">1. Take a Photo</h3>
            <p className="text-sm text-slate-500">Capture the garbage dump</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">2. Auto-Location</h3>
            <p className="text-sm text-slate-500">We fetch GPS coordinates</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">3. AI Verification</h3>
            <p className="text-sm text-slate-500">Fast reporting to BBMP</p>
          </div>
        </div>
      </div>

      <Link 
        to="/submit" 
        className="w-full max-w-sm bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-4 px-6 rounded-2xl font-bold text-center text-lg shadow-xl shadow-indigo-200 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
      >
        <Camera size={24} />
        Report Garbage Now
      </Link>
      
      <div className="mt-8 flex gap-8 text-center text-slate-500">
        <div>
          <div className="text-2xl font-black text-slate-800">12K+</div>
          <div className="text-xs font-medium uppercase tracking-wider">Reports</div>
        </div>
        <div>
          <div className="text-2xl font-black text-green-600">8.5K</div>
          <div className="text-xs font-medium uppercase tracking-wider">Cleaned</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
