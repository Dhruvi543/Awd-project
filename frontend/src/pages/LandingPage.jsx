import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../logo.png';
// Import hero images from src root
import heroImage1 from '../hero_image1.jpeg';
import heroImage2 from '../hero_image2.jpeg';
import heroImage3 from '../hero_image3.jpeg';
import heroImage4 from '../hero_image4.jpeg';
import heroImage5 from '../hero_image5.jpeg';
import heroImage6 from '../hero_image6.jpeg';
import heroImage7 from '../hero_image7.jpeg';
import heroImage8 from '../hero_image8.jpeg';
// Import feature images from assets
import featureImage1 from '../assets/images/feature-image-1.jpeg';
import featureImage2 from '../assets/images/feature-image-2.jpeg';
import featureImage3 from '../assets/images/feature-image-3.jpeg';

const LandingPage = () => {
  const { theme } = useTheme();
  const images = [
    heroImage1,
    heroImage2,
    heroImage3,
    heroImage4,
    heroImage5,
    heroImage6,
    heroImage7,
    heroImage8,
  ];
  const AUTO_PLAY_MS = 2000; // faster autoplay interval
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, AUTO_PLAY_MS);
    return () => clearInterval(intervalRef.current);
  }, [images.length, AUTO_PLAY_MS]);

  const goTo = (index) => setCurrent((index + images.length) % images.length);
  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  const onTouchStart = (e) => { touchStartX.current = e.changedTouches[0].clientX; };
  const onTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const delta = touchEndX.current - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) { prev(); } else { next(); }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Intro copy section (text first) */}
      <section id="home" className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-1.5 text-xs font-medium ring-1 ring-blue-200 dark:ring-blue-700 mb-6">
              <img 
                src={logo} 
                alt="DOXI" 
                className="h-4 w-4 object-contain" 
                style={{
                  filter: theme === 'dark' ? 'invert(1) brightness(1.2)' : 'none'
                }}
              />
              Trusted by patients and doctors
            </div>
            
            <h1 className="mb-8">
              <div className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-none mb-3">
                Your Health,
              </div>
              <div className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-blue-600 dark:text-blue-400 leading-none mb-3">
                Our Priority
              </div>
              <div className="text-xl md:text-2xl font-medium text-gray-500 dark:text-gray-400 mt-4">
                Powered by DOXI
              </div>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-8 max-w-3xl mx-auto mb-8">
              Book appointments in seconds, connect with trusted specialists, and manage your health securely — anywhere, anytime.
            </p>
            
            {/* Structured CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link 
                to="/register" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-lg text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200"
              >
                I already have an account
              </Link>
            </div>
            
            {/* Features List */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                <span>Verified Specialists</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                <span>HIPAA-grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                <span>24/7 Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero slider section (now placed below text) */
      }
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl bg-gray-200 dark:bg-gray-700"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative h-[260px] sm:h-[360px] md:h-[520px]">
              <img
                src={images[current]}
                alt={`Hero slide ${current + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            </div>

            <button
              aria-label="Previous slide"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full h-10 w-10 flex items-center justify-center shadow"
            >
              ❮
            </button>
            <button
              aria-label="Next slide"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full h-10 w-10 flex items-center justify-center shadow"
            >
              ❯
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full ${i === current ? 'bg-white dark:bg-blue-400 shadow ring-2 ring-blue-500 dark:ring-blue-400' : 'bg-white/70 dark:bg-gray-600 hover:bg-white dark:hover:bg-gray-500'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Logos strip */}
      <section className="bg-white dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">Delivering care you can trust</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 scroll-mt-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">All-in-one healthcare platform</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">From discovery to recovery — DOXI streamlines every step of your journey.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-md bg-blue-600 text-white flex items-center justify-center">🔎</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Find the right doctor</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Find doctor by name and specialization, ratings, and availability near you.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-md bg-blue-600 text-white flex items-center justify-center">🗓️</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Easy appointment booking</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Book appointments easily in seconds with our simple booking system.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-md bg-blue-600 text-white flex items-center justify-center">📅</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Appointment management</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">View, reschedule, or cancel your appointments with ease from your dashboard.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-md bg-blue-600 text-white flex items-center justify-center">🔐</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Privacy-first</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">End-to-end encryption and role-based access to your records.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-md bg-blue-600 text-white flex items-center justify-center">⚡</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Fast & reliable</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Optimized performance across devices for a smooth experience.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-md bg-blue-600 text-white flex items-center justify-center">👥</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Verified doctors</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">All doctors are verified with proper credentials and certifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section id="advantages" className="bg-white dark:bg-gray-800 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">Advantages</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Why choose DOXI?</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">Expert doctors, effortless booking, and serious security all in one place.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow p-8">
              <div className="h-40 w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-500 dark:to-blue-600 rounded-md mb-4 flex items-center justify-center">
                <img 
                  src={featureImage1} 
                  alt="Experienced doctor consulting a patient" 
                  className="h-full w-full object-cover rounded-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="h-full w-full flex items-center justify-center text-blue-600 text-4xl">👨‍⚕️</div>';
                  }}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Expert Doctors</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
                <li>MBBS/MD certified specialists</li>
                <li>Verified profiles and ratings</li>
                <li>In-person clinic appointments</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow p-8">
              <div className="h-40 w-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-500 dark:to-green-600 rounded-md mb-4 flex items-center justify-center">
                <img 
                  src={featureImage2} 
                  alt="App UI showing easy booking flow" 
                  className="h-full w-full object-cover rounded-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="h-full w-full flex items-center justify-center text-green-600 text-4xl">📱</div>';
                  }}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Easy to Use</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
                <li>Book in under 60 seconds</li>
                <li>Smart reminders and updates</li>
                <li>Works on any device</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow p-8">
              <div className="h-40 w-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-500 dark:to-purple-600 rounded-md mb-4 flex items-center justify-center">
                <img 
                  src={featureImage3} 
                  alt="Affordable medical services" 
                  className="h-full w-full object-cover rounded-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="h-full w-full flex items-center justify-center text-purple-600 text-4xl">💰</div>';
                  }}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Convenient</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
                <li>Easy appointment scheduling</li>
                <li>Instant appointment confirmations</li>
                <li>24/7 platform access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">Contact Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Get in Touch</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">We'd love to hear from you! Reach out to us with any questions or feedback.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Address</h4>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">123 Healthcare Avenue<br/>Medical District, MD 12345<br/>United States</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Phone</h4>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">+1 (555) 123-4567</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Mon-Fri 9AM-6PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Email</h4>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">support@doxi.com</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">response within 24 hours</p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Follow Us</h4>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-blue-400 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-pink-600 hover:bg-pink-700 rounded-full flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                    placeholder="Your message..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-extrabold text-white">Ready to take control of your health?</h3>
          <p className="mt-4 text-blue-100 dark:text-blue-200 text-lg">Join thousands who trust DOXI for fast, secure, and reliable care.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-3 rounded-md bg-white dark:bg-gray-100 text-blue-700 dark:text-blue-800 font-medium hover:bg-blue-50 dark:hover:bg-gray-200 transition-colors">Create your account</Link>
            <Link to="/login" className="px-8 py-3 rounded-md bg-blue-500 dark:bg-blue-600 text-white font-medium hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors">Sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;


