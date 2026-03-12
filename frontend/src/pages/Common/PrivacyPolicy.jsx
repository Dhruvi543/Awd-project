import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../api/apiService';

const PrivacyPolicy = () => {
  const [privacyData, setPrivacyData] = useState({
    content: '',
    version: 1,
    lastUpdated: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get('/api/terms/privacy');
      if (response.data.success) {
        setPrivacyData({
          content: response.data.data.content,
          version: response.data.data.version,
          lastUpdated: response.data.data.lastUpdated
        });
      }
    } catch (err) {
      setError('Failed to load Privacy Policy. Please try again later.');
      console.error('Error fetching privacy policy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Learn how we collect, use, and protect your personal information
              </p>
            </div>
            <Link
              to="/"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading Privacy Policy...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchPrivacyPolicy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Version Info Bar */}
            <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-green-900 dark:text-green-300">
                    <span className="font-medium">Version:</span>{' '}
                    <span className="font-bold">{privacyData.version}</span>
                  </span>
                  <span className="text-green-700 dark:text-green-400">
                    <span className="font-medium">Last Updated:</span>{' '}
                    {formatDate(privacyData.lastUpdated)}
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Policy Content */}
            <div className="p-6 sm:p-8">
              <div className="prose dark:prose-invert max-w-none">
                {privacyData.content ? (
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {privacyData.content}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No Privacy Policy content available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                  Your privacy is important to us. Read our{' '}
                  <Link to="/terms-and-conditions" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Terms & Conditions
                  </Link>
                  {' '}for more information.
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data Protection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We implement industry-standard security measures to protect your personal and medical information.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Us</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Have questions about your privacy?{' '}
              <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact our support team
              </Link>.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} DOXI Healthcare Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
