import { ArrowLeft, Camera, MapPin, AlertCircle, X } from 'lucide-react';
import { TabBar } from './TabBar';
import { useState } from 'react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { api } from '../services/api';

interface ReportIssueProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  authToken: string;
}

const issueTypes = [
  { id: 'damaged', label: 'Package damaged', icon: AlertCircle },
  { id: 'wrong-address', label: 'Wrong address', icon: MapPin },
  { id: 'unavailable', label: 'Customer unavailable', icon: AlertCircle },
  { id: 'vehicle', label: 'Vehicle issue', icon: AlertCircle },
  { id: 'other', label: 'Other', icon: AlertCircle },
];

export function ReportIssue({ onNavigate, authToken }: ReportIssueProps) {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        setCapturedPhoto(`data:image/${image.format};base64,${image.base64String}`);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleSendReport = async () => {
    if (!selectedIssue) {
      alert('Please select an issue type');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current location
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const reportData = {
        issueType: selectedIssue,
        notes: notes,
        photo: capturedPhoto,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        },
        reportedAt: new Date().toISOString()
      };

      // Send to backend API
      await api.createReport(reportData, authToken);

      alert('Report sent successfully!');

      // Reset form
      setSelectedIssue(null);
      setNotes('');
      setCapturedPhoto(null);

      // Navigate back to dashboard
      setTimeout(() => {
        onNavigate('dashboard');
      }, 500);

    } catch (error: any) {
      console.error('Error sending report:', error);

      if (error.message?.includes('location')) {
        alert('Failed to get location. Please enable location permissions in settings.');
      } else {
        alert('Failed to send report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1128] pb-32">
      {/* Header */}
      <div className="bg-[#050505] px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('dashboard')} className="text-[#f2f4f8]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>Report Issue</h2>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-4">
        {/* Issue Type Selection */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6">
          <h3 className="text-[#f2f4f8] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Select Issue Type</h3>

          <div className="space-y-3">
            {issueTypes.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssue(issue.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedIssue === issue.id
                  ? 'bg-[#e10600] text-[#f2f4f8]'
                  : 'bg-[#0a1128]/60 text-[#f2f4f8] border border-[#555555]/30 hover:border-[#e10600]/50'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedIssue === issue.id ? 'bg-[#f2f4f8]/20' : 'bg-[#555555]/20'
                  }`}>
                  <issue.icon className="w-5 h-5" />
                </div>
                <span>{issue.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6">
          <h3 className="text-[#f2f4f8] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Additional Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className="w-full bg-[#0a1128]/60 border border-[#555555]/30 rounded-2xl px-4 py-3 text-[#f2f4f8] placeholder-[#555555] focus:outline-none focus:border-[#e10600] transition-all resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6">
          <h3 className="text-[#f2f4f8] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Attach Photo</h3>

          {capturedPhoto ? (
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-48 object-cover rounded-2xl"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 w-8 h-8 bg-[#e10600] rounded-full flex items-center justify-center text-[#f2f4f8] shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleTakePhoto}
              className="border-2 border-dashed border-[#555555]/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#e10600]/50 transition-all active:scale-[0.98]"
            >
              <div className="w-16 h-16 bg-[#555555]/20 rounded-full flex items-center justify-center mb-3">
                <Camera className="w-8 h-8 text-[#555555]" />
              </div>
              <span className="text-[#555555]">Tap to take photo</span>
            </div>
          )}
        </div>

        {/* Location Info */}
        <div className="bg-[#e10600]/10 backdrop-blur-sm border border-[#e10600]/30 rounded-2xl p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#e10600]" />
          <div className="text-[#f2f4f8] text-sm">
            Your current location will be attached automatically
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSendReport}
          disabled={isSubmitting || !selectedIssue}
          className={`w-full py-5 rounded-2xl transition-all shadow-lg ${isSubmitting || !selectedIssue
            ? 'bg-[#555555]/20 text-[#555555] shadow-none cursor-not-allowed'
            : 'bg-[#e10600] hover:bg-[#c10500] active:scale-[0.98] text-[#f2f4f8] shadow-[#e10600]/30'
            }`}
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {isSubmitting ? 'SENDING...' : 'SEND REPORT'}
        </button>
      </div>

      <TabBar currentTab="home" onNavigate={onNavigate} />
    </div>
  );
}