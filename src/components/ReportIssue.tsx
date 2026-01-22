import { ArrowLeft, Camera, MapPin, AlertCircle, X } from 'lucide-react';
import { TabBar } from './TabBar';
import { useState } from 'react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { api } from '../services/api';

interface ReportIssueProps {
  onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
  authToken: string;
  hasRoute?: boolean;
}

const issueTypes = [
  { id: 'damaged', label: 'Package damaged', icon: AlertCircle },
  { id: 'wrong-address', label: 'Wrong address', icon: MapPin },
  { id: 'unavailable', label: 'Customer unavailable', icon: AlertCircle },
  { id: 'vehicle', label: 'Vehicle issue', icon: AlertCircle },
  { id: 'other', label: 'Other', icon: AlertCircle },
];

export function ReportIssue({ onNavigate, authToken, hasRoute }: ReportIssueProps) {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 50,
        width: 1024,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        setCapturedPhoto(`data:image/${image.format};base64,${image.base64String}`);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      // Don't alert if user cancelled
      if ((error as any).message !== 'User cancelled photos app') {
        alert('Failed to take photo. Please try again.');
      }
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
      // Get current location (optional)
      let locationData = null;
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false, // Use coarse location for speed/reliability
          timeout: 5000 // 5 second timeout
        });

        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        };
      } catch (locError) {
        console.warn('Could not get location:', locError);
        // Continue without location
      }

      const reportData = {
        issueType: selectedIssue,
        notes: notes,
        photo: capturedPhoto,
        location: locationData,
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
      alert(`Failed to send report: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-gray-900 text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>Report Issue</h2>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-4">
        {/* Issue Type Selection */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
          <h3 className="text-gray-900 font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Select Issue Type</h3>

          <div className="space-y-3">
            {issueTypes.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssue(issue.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedIssue === issue.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedIssue === issue.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                  <issue.icon className={`w-5 h-5 ${selectedIssue === issue.id ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <span>{issue.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
          <h3 className="text-gray-900 font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Additional Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 transition-all resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
          <h3 className="text-gray-900 font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Attach Photo</h3>

          {capturedPhoto ? (
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-48 object-cover rounded-2xl"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleTakePhoto}
              className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-3">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
              <span className="text-gray-500 font-medium">Tap to take photo</span>
            </div>
          )}
        </div>

        {/* Location Info */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-red-600" />
          <div className="text-red-700 text-sm font-medium">
            Your current location will be attached automatically
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSendReport}
          disabled={isSubmitting || !selectedIssue}
          className={`w-full py-5 rounded-2xl transition-all shadow-lg font-bold ${isSubmitting || !selectedIssue
            ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white shadow-red-200'
            }`}
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {isSubmitting ? 'SENDING...' : 'SEND REPORT'}
        </button>
      </div>

      <TabBar currentTab="report" onNavigate={onNavigate} hasRoute={hasRoute} />
    </div>
  );
}