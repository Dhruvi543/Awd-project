import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import Toast from '../../components/feedback/Toast';

const CommissionEditor = () => {
  const [platformFeePercentage, setPlatformFeePercentage] = useState(20);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [exampleAmount, setExampleAmount] = useState(1000);

  useEffect(() => {
    fetchCommissionSettings();
  }, []);

  const fetchCommissionSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCommissionSettings();
      if (response.data.success) {
        const settings = response.data.data;
        setCurrentSettings(settings);
        setPlatformFeePercentage(settings.platformFeePercentage || settings.platformCommissionPercentage);
      }
    } catch (err) {
      console.error('Error fetching commission settings:', err);
      showToast('Failed to load commission settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSaveClick = () => {
    if (platformFeePercentage < 0 || platformFeePercentage > 100) {
      showToast('Platform fee percentage must be between 0 and 100', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setShowConfirmModal(false);

    try {
      const response = await apiService.updateCommissionSettings({
        platformFeePercentage: platformFeePercentage
      });

      if (response.data.success) {
        setCurrentSettings(response.data.data);
        showToast('Platform fee settings updated successfully. All doctors have been notified.', 'success');
      } else {
        showToast(response.data.message || 'Failed to update commission settings', 'error');
      }
    } catch (err) {
      console.error('Error updating commission settings:', err);
      showToast(err.response?.data?.message || 'Failed to update commission settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const calculateExample = () => {
    const doctorBookingFee = exampleAmount;
    const platformFee = Math.round((doctorBookingFee * platformFeePercentage) / 100);
    const clinicAmount = doctorBookingFee - platformFee;
    return { platformFee, clinicAmount };
  };

  const { platformFee, clinicAmount } = calculateExample();

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading commission settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commission Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure the platform fee percentage. This percentage of the doctor's booking fee is collected online from patients to secure appointments. The rest is paid directly to the doctor at the clinic.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Important Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Changing the platform fee percentage will affect all future appointments. 
                <strong>All doctors will be notified</strong> of this change via email and in-app notifications. 
                Existing appointments will retain their original fee rates.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Settings Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Platform Fee Percentage
          </h2>

          <div className="space-y-6">
            {/* Current Setting Display */}
            {currentSettings && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Platform Fee:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currentSettings.platformFeePercentage || currentSettings.platformCommissionPercentage}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {(currentSettings.platformFeeLastUpdated || currentSettings.commissionLastUpdated) 
                    ? new Date(currentSettings.platformFeeLastUpdated || currentSettings.commissionLastUpdated).toLocaleString()
                    : 'Not yet set'}
                </div>
              </div>
            )}

            {/* Commission Input */}
            <div>
              <label htmlFor="commission" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Platform Fee Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="commission"
                  min="0"
                  max="100"
                  value={platformFeePercentage}
                  onChange={(e) => setPlatformFeePercentage(Number(e.target.value))}
                  className="block w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-lg"
                  placeholder="Enter percentage (0-100)"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">%</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This percentage of the doctor's booking fee is collected online from patients to secure appointments. The rest is paid directly to the doctor at the clinic.
              </p>
            </div>

            {/* Slider for easy adjustment */}
            <div>
              <input
                type="range"
                min="0"
                max="50"
                value={platformFeePercentage}
                onChange={(e) => setPlatformFeePercentage(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveClick}
              disabled={saving || platformFeePercentage === (currentSettings?.platformFeePercentage || currentSettings?.platformCommissionPercentage)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                saving || platformFeePercentage === (currentSettings?.platformFeePercentage || currentSettings?.platformCommissionPercentage)
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Update Platform Fee Settings'
              )}
            </button>
          </div>
        </div>

        {/* Live Calculator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Live Calculation Preview
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            See how the platform fee split works with different booking fees.
          </p>

          <div className="space-y-6">
            {/* Example Amount Input */}
            <div>
              <label htmlFor="exampleAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Example Doctor's Booking Fee (₹)
              </label>
              <input
                type="number"
                id="exampleAmount"
                min="0"
                value={exampleAmount}
                onChange={(e) => setExampleAmount(Number(e.target.value))}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter example amount"
              />
            </div>

            {/* Calculation Breakdown */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Doctor's Booking Fee</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{exampleAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Platform Collects Online ({platformFeePercentage}%)</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-900 dark:text-white font-medium">Doctor Collects at Clinic</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">₹{clinicAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Visual Representation */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Split Visualization</p>
              <div className="h-8 rounded-lg overflow-hidden flex">
                <div 
                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${platformFeePercentage}%` }}
                >
                  {platformFeePercentage >= 15 && `Platform ${platformFeePercentage}%`}
                </div>
                <div 
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${100 - platformFeePercentage}%` }}
                >
                  {100 - platformFeePercentage >= 15 && `Doctor ${100 - platformFeePercentage}%`}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Platform (Online): ₹{platformFee.toFixed(2)}</span>
                <span>Doctor (Clinic): ₹{clinicAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Platform Fee Change"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to update the platform fee?</p>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-400">Current:</span>
                <span className="font-medium">{currentSettings?.platformFeePercentage || currentSettings?.platformCommissionPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">New:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{platformFeePercentage}%</span>
              </div>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Warning:</strong> This change will notify all doctors on the platform.
            </p>
          </div>
        }
        confirmText="Yes, Update Platform Fee"
        cancelText="Cancel"
        type="warning"
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default CommissionEditor;
