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

      {/* Final CTA */}
      <section id="contact" className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 scroll-mt-20">
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


