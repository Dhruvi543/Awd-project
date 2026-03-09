import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';
import ConfirmModal from '../../components/feedback/ConfirmModal';

const TermsEditor = () => {
  const [termsContent, setTermsContent] = useState('');
  const [currentVersion, setCurrentVersion] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchCurrentTerms();
  }, []);

  const fetchCurrentTerms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get('/api/terms/current');
      if (response.data.success) {
        setTermsContent(response.data.data.content);
        setCurrentVersion(response.data.data.version);
        setLastUpdated(new Date(response.data.data.lastUpdated));
      }
    } catch (err) {
      setError('Failed to fetch current Terms & Conditions');
      console.error('Error fetching terms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (e) => {
    setTermsContent(e.target.value);
    setHasChanges(true);
    setError(null);
    setSuccess(null);
  };

  const handleSave = () => {
    // Validate content
    if (!termsContent.trim()) {
      setError('Terms & Conditions content cannot be empty');
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiService.put('/api/terms/update', {
        content: termsContent.trim()
      });

      if (response.data.success) {
        setSuccess(`Terms & Conditions updated successfully! Version ${response.data.data.version}. All doctors have been notified and must re-accept.`);
        setCurrentVersion(response.data.data.version);
        setLastUpdated(new Date());
        setHasChanges(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update Terms & Conditions');
      console.error('Error saving terms:', err);
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
    }
  };

  const handleReset = () => {
    fetchCurrentTerms();
    setHasChanges(false);
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-full">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading Terms & Conditions...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Terms & Conditions Editor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage the platform Terms & Conditions that doctors must accept
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Current Version Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Current Version: <span className="font-bold">{currentVersion}</span>
              </span>
              {lastUpdated && (
                <span className="text-sm text-blue-700 dark:text-blue-400">
                  Last Updated: {lastUpdated.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
            {hasChanges && (
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                Important Notice
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Updating the Terms & Conditions will:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-1 list-disc list-inside">
                <li>Increment the version number</li>
                <li>Notify all active doctors via email and in-app notification</li>
                <li>Require all doctors to re-accept the new terms on their next login</li>
                <li>Prevent doctors from using the platform until they accept the new terms</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Edit Terms & Conditions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter the full text of the Terms & Conditions below
            </p>
          </div>

          <div className="p-6">
            <textarea
              value={termsContent}
              onChange={handleContentChange}
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm leading-relaxed"
              placeholder="Enter Terms & Conditions content here..."
            />
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              Reset Changes
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Preview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This is how doctors will see the Terms & Conditions
            </p>
          </div>
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              {termsContent || 'No content to preview'}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSave}
        title="Update Terms & Conditions?"
        message={
          <div className="text-left">
            <p className="mb-3">
              You are about to update the Terms & Conditions. This action will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Create a new version (v{currentVersion + 1})</li>
              <li>Notify all active doctors immediately</li>
              <li>Require all doctors to re-accept on their next login</li>
              <li>Block platform access until acceptance</li>
            </ul>
            <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
              Are you sure you want to proceed?
            </p>
          </div>
        }
        confirmText="Yes, Update Terms"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default TermsEditor;
