import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const TermsAcceptanceModal = ({ isOpen, onAccept, currentTerms }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      setError('');
    }
  }, [isOpen]);

  // Prevent closing the modal by clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Don't allow escape to close
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAccept = async () => {
    if (!isChecked) {
      setError('Please read and accept the Terms & Conditions to continue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await apiService.post('/api/terms/accept', {
        accepted: true
      });

      if (response.data.success) {
        onAccept();
      } else {
        setError(response.data.message || 'Failed to accept terms. Please try again.');
      }
    } catch (err) {
      console.error('Error accepting terms:', err);
      setError(err.response?.data?.message || 'Failed to accept terms. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop - non-clickable */}
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
          {/* Header */}
          <div className="bg-blue-600 dark:bg-blue-700 px-4 py-4 sm:px-6">
            <h3 className="text-xl font-bold text-white">
              Terms & Conditions Update Required
            </h3>
            <p className="mt-1 text-sm text-blue-100">
              Please review and accept the updated Terms & Conditions to continue using the platform.
            </p>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            {/* Warning Banner */}
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Action Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      Our Terms & Conditions have been updated. You must accept the new terms before you can continue using the platform. 
                      {currentTerms?.version && (
                        <span className="font-semibold"> Version {currentTerms.version}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Terms & Conditions
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 h-64 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentTerms?.terms || 'Loading terms...'}
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms-accept"
                  name="terms-accept"
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms-accept" className="font-medium text-gray-700 dark:text-gray-300">
                  I have read and agree to the Terms & Conditions
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  By checking this box, you acknowledge that you have read, understood, and agree to be bound by these terms.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isSubmitting}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Accept & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptanceModal;
