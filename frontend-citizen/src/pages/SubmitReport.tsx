import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, UploadCloud, AlertCircle, Image as ImageIcon, Check } from 'lucide-react';

const SubmitReport: React.FC = () => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number, acc: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          console.error(error);
          alert('Error capturing location. Please enable GPS.');
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  const submitReport = async () => {
    if (!image || !location) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/reports/citizen/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: image,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.acc,
          timestamp: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (response.ok) {
        navigate(`/track/${data.report_id}`);
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('Network error while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-md mx-auto pt-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Report Issue</h2>
        <p className="text-slate-500 font-medium mt-1">Help us locate the garbage dump</p>
      </div>
      
      {/* Premium Progress Indicator */}
      <div className="flex justify-between mb-10 relative px-2">
        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
        <div className={`absolute top-1/2 left-4 h-1.5 bg-gradient-to-r from-green-500 to-teal-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-700 ease-out shadow-sm shadow-green-500/50`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : 'calc(100% - 2rem)' }}></div>
        
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm ${step > s ? 'bg-green-600 text-white border-none' : step === s ? 'bg-white text-green-600 border-2 border-green-600 ring-4 ring-green-50' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
              {step > s ? <Check strokeWidth={3} size={18} /> : s}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? 'text-green-600' : 'text-slate-400'}`}>
              {s === 1 ? 'Photo' : s === 2 ? 'Location' : 'Submit'}
            </span>
          </div>
        ))}
      </div>

      <div className="relative">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="glass-card border-2 border-dashed border-green-300 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center gap-5 cursor-pointer hover:bg-green-50/50 hover:border-green-400 transition-all relative h-72 group">
              <input type="file" accept="image/jpeg, image/png" capture="environment" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
              
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                <div className="bg-white p-5 rounded-full shadow-lg text-green-600 relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                  <Camera size={40} strokeWidth={1.5} />
                </div>
              </div>
              
              <div>
                <p className="font-extrabold text-slate-800 text-lg">Tap to take photo</p>
                <p className="text-sm font-medium text-slate-500 flex items-center justify-center gap-1 mt-1">
                  <ImageIcon size={14} /> or choose from gallery
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && image && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
            <div className="rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 border-[6px] border-white relative aspect-[4/3] bg-slate-100 group">
              <img src={image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-medium text-sm flex items-center gap-1"><Check size={16} className="text-green-400"/> Photo captured</span>
              </div>
            </div>
            
            <button onClick={captureLocation} className="group relative w-full bg-slate-900 text-white py-4.5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <MapPin size={22} className="relative z-10 animate-bounce" />
              <span className="relative z-10">Detect My Location</span>
            </button>
            <button onClick={() => setStep(1)} className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors">
              Retake Photo
            </button>
          </div>
        )}

        {step === 3 && image && location && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
            <div className="glass-card p-5 rounded-3xl space-y-4">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Check className="text-green-500 bg-green-100 p-1 rounded-full" size={24} />
                Ready to Submit
              </h3>
              
              <div className="flex gap-4 items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white">
                  <img src={image} className="w-full h-full object-cover" />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-800 mb-0.5 mt-1">Incident Location</p>
                  <p className="text-slate-500 font-mono text-xs bg-white py-1 px-2 rounded-md inline-block border border-slate-100 mb-1">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                  <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <MapPin size={12} /> High Accuracy ({Math.round(location.acc)}m)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-amber-50/80 border border-amber-200/50 p-4 rounded-2xl text-amber-800 text-sm font-medium shadow-sm">
              <AlertCircle className="shrink-0 mt-0.5 text-amber-500" size={18} />
              <p>False reporting may lead to account penalties. By submitting, you verify this dump exists.</p>
            </div>

            <button 
              onClick={submitReport} 
              disabled={isSubmitting}
              className={`group relative w-full bg-slate-900 text-white py-4.5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all duration-300 overflow-hidden ${isSubmitting ? 'opacity-80 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-green-500/30'}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-green-600 via-teal-600 to-green-600 bg-300% ${isSubmitting ? 'animate-gradient' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-500'}`}></div>
              
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin relative z-10"></div>
              ) : (
                <UploadCloud size={22} className="relative z-10" />
              )}
              <span className="relative z-10">{isSubmitting ? 'Verifying & Submitting...' : 'Confirm & Submit'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitReport;
