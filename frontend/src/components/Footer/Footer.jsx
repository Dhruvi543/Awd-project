import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white py-8 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">DOXI</h3>
            <p className="text-gray-300 dark:text-gray-400">
              Your trusted healthcare management system for booking appointments and managing medical services.
            </p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300 dark:text-gray-400">
              <li><a href="/" className="hover:text-white dark:hover:text-gray-200 transition-colors">Home</a></li>
              <li><a href="/doctors" className="hover:text-white dark:hover:text-gray-200 transition-colors">Find Doctors</a></li>
              <li><a href="/login" className="hover:text-white dark:hover:text-gray-200 transition-colors">Login</a></li>
              <li><a href="/register" className="hover:text-white dark:hover:text-gray-200 transition-colors">Register</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-300 dark:text-gray-400">
              <li>Email: support@doxi.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Hours: Mon-Fri 9AM-6PM</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 dark:border-gray-800 mt-8 pt-8 text-center text-gray-300 dark:text-gray-400">
          <p>&copy; 2024 DOXI Healthcare Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;