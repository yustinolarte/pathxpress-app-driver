import { CheckCircle, XCircle, Camera, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Camera as CapacitorCamera, CameraResultType } from '@capacitor/camera';
import { api } from '../services/api';

interface VehicleInspectionProps {
  onComplete: () => void;
  authToken: string;
}

interface InspectionItem {
  id: string;
  label: string;
  status: 'ok' | 'issue' | null;
  photo?: string; // Base64 photo string
}

export function VehicleInspection({ onComplete, authToken }: VehicleInspectionProps) {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    { id: 'tires', label: 'Tires & Wheels', status: null },
    { id: 'lights', label: 'Lights & Signals', status: null },
    { id: 'fuel', label: 'Fuel Level', status: null },
    { id: 'oil', label: 'Oil & Fluids', status: null },
    { id: 'brakes', label: 'Brakes', status: null },
    { id: 'cleanliness', label: 'Vehicle Cleanliness', status: null },
    { id: 'documents', label: 'Documents', status: null },
    { id: 'mirrors', label: 'Mirrors', status: null },
  ]);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = (id: string, status: 'ok' | 'issue') => {
    // If changing to OK, clear any previous issue data
    if (status === 'ok') {
      setInspectionItems(items =>
        items.map(item =>
          item.id === id ? { ...item, status, photo: undefined } : item
        )
      );
    } else {
      // If issue, open modal to force photo
      setSelectedItem(id);
      setShowPhotoModal(true);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64
      });

      if (image.base64String && selectedItem) {
        setInspectionItems(items =>
          items.map(item =>
            item.id === selectedItem ? { ...item, status: 'issue', photo: image.base64String } : item
          )
        );
        setShowPhotoModal(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      // Don't close modal if failed/cancelled, force user to try again or cancel issue status
    }
  };

  const handleCancelIssue = () => {
    // If user cancels photo, revert status to null (unchecked)
    setShowPhotoModal(false);
    setSelectedItem(null);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Filter items with issues
      const issues = inspectionItems.filter(item => item.status === 'issue');

      // Submit each issue to backend
      for (const issue of issues) {
        await api.createReport({
          issueType: `Inspection: ${issue.label}`,
          description: `Failed inspection check for ${issue.label}`,
          photo: issue.photo,
          location: { lat: 0, lng: 0 } // Could add real location if needed
        }, authToken);
      }

      onComplete();
    } catch (error) {
      console.error('Failed to submit inspection:', error);
      alert('Failed to submit inspection reports. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allChecked = inspectionItems.every(item => item.status !== null);
  const hasIssues = inspectionItems.some(item => item.status === 'issue');

  return (
    <div className="min-h-screen bg-[#0a1128] relative">
      {/* Header */}
      <div className="bg-[#050505] px-6 pt-12 pb-6">
        <div className="text-center mb-4">
          <div className="inline-block mb-3">
            <h1 className="text-[#f2f4f8] tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
              VEHICLE INSPECTION
            </h1>
          </div>
          <p className="text-[#555555]">Check your vehicle before starting the route</p>
        </div>

        {/* Vehicle Info */}
        <div className="bg-[#0a1128]/60 backdrop-blur-sm rounded-2xl p-4 border border-[#555555]/20 flex items-center justify-between">
          <div>
            <div className="text-[#555555] mb-1">Assigned Vehicle</div>
            <div className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>Van - DXB 4523</div>
          </div>
          <div className="text-right">
            <div className="text-[#555555] mb-1">Route</div>
            <div className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>DXB-N-042</div>
          </div>
        </div>
      </div>

      {/* Inspection Checklist */}
      <div className="px-6 pt-6 pb-32 space-y-3">
        {inspectionItems.map((item) => (
          <div
            key={item.id}
            className={`bg-[#050505]/60 backdrop-blur-sm border rounded-3xl p-5 transition-all ${item.status === 'ok'
                ? 'border-[#00c853]/50'
                : item.status === 'issue'
                  ? 'border-[#e10600]/50'
                  : 'border-[#555555]/20'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-[#f2f4f8] mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.label}</h3>
                {item.photo && (
                  <div className="flex items-center gap-2 text-[#e10600]">
                    <Camera className="w-4 h-4" />
                    <span>Photo attached</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(item.id, 'ok')}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.status === 'ok'
                      ? 'bg-[#00c853] text-[#f2f4f8]'
                      : 'bg-[#0a1128]/60 border border-[#555555]/30 text-[#555555] hover:border-[#00c853]/50'
                    }`}
                >
                  <CheckCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'issue')}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.status === 'issue'
                      ? 'bg-[#e10600] text-[#f2f4f8]'
                      : 'bg-[#0a1128]/60 border border-[#555555]/30 text-[#555555] hover:border-[#e10600]/50'
                    }`}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-[#555555]/20 px-6 py-6">
        <div className="max-w-md mx-auto space-y-3">
          {/* Status Summary */}
          <div className="flex items-center justify-between text-[#555555] mb-2">
            <span>Checked: {inspectionItems.filter(i => i.status !== null).length}/{inspectionItems.length}</span>
            {hasIssues && (
              <span className="text-[#e10600]">
                {inspectionItems.filter(i => i.status === 'issue').length} issue(s) reported
              </span>
            )}
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={!allChecked || isSubmitting}
            className={`w-full py-5 rounded-2xl transition-all flex items-center justify-center gap-2 ${allChecked && !isSubmitting
                ? 'bg-[#e10600] hover:bg-[#c10500] text-[#f2f4f8] shadow-lg shadow-[#e10600]/30'
                : 'bg-[#555555]/20 text-[#555555] cursor-not-allowed'
              }`}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {isSubmitting ? 'Submitting...' : allChecked ? 'COMPLETE INSPECTION' : 'COMPLETE ALL CHECKS'}
            {allChecked && !isSubmitting && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="bg-[#0a1128] border border-[#555555]/20 rounded-3xl p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-[#e10600]/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-[#e10600]" />
                </div>
                <h3 className="text-[#f2f4f8] mb-2 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Issue Detected
                </h3>
                <p className="text-[#555555] text-center">
                  You must take a photo of the issue to proceed.
                </p>
              </div>

              {/* Photo Upload Area */}
              <div
                onClick={handleTakePhoto}
                className="border-2 border-dashed border-[#e10600]/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#e10600] transition-all mb-6 bg-[#e10600]/5"
              >
                <div className="w-12 h-12 bg-[#e10600]/20 rounded-full flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-[#e10600]" />
                </div>
                <span className="text-[#f2f4f8] font-medium">Take Photo (Required)</span>
              </div>

              <button
                onClick={handleCancelIssue}
                className="w-full bg-[#555555]/20 text-[#f2f4f8] py-4 rounded-2xl hover:bg-[#555555]/30 transition-all"
              >
                Cancel Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
