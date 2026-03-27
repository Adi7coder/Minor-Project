import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, UploadCloud, AlertCircle } from 'lucide-react';

const SubmitReport: React.FC = () => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number, acc: number} | null>(null);
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setStep(2);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const captureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            acc: position.coords.accuracy
          });
          setStep(3);
        },
        (error) => {
          alert('Error capturing location. Please enable GPS.');
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  const submitReport = () => {
    // API mock logic would go here
    setTimeout(() => {
      navigate('/track/GD-20250326-ABCDE');
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">New Report</h2>
      
      {/* Progress */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
        <div className={`absolute top-1/2 left-0 h-1 bg-[#667eea] -z-10 -translate-y-1/2 rounded-full transition-all`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        {[1, 2, 3].map((s) => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-[#667eea] text-white' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-right-4">
          <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-indigo-100 transition-colors relative h-64">
            <input type="file" accept="image/jpeg, image/png" capture="environment" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
            <div className="bg-white p-4 rounded-full shadow-sm text-indigo-500">
              <Camera size={32} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Tap to take photo</p>
              <p className="text-sm text-slate-500">or upload from gallery</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && image && (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative aspect-video">
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          </div>
          
          <button onClick={captureLocation} className="w-full bg-[#667eea] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-colors">
            <MapPin size={20} />
            Capture Location
          </button>
        </div>
      )}

      {step === 3 && image && location && (
        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 border-b pb-2">Review Details</h3>
            
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                <img src={image} className="w-full h-full object-cover" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-800">Location</p>
                <p className="text-slate-500">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                <p className="text-xs text-green-600 mt-1">Accuracy: ±{Math.round(location.acc)}m</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl text-amber-800 text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p>By submitting, you agree to our terms. False reporting may lead to account penalties.</p>
          </div>

          <button onClick={submitReport} className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:opacity-90 transition-opacity">
            <UploadCloud size={20} />
            Confirm & Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmitReport;
