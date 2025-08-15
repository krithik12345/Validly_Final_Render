import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiUsers, FiUserCheck, FiZap, FiShield, FiBarChart2 } from 'react-icons/fi';
import validlyBanner from '../validly_banner.png';
import { supabase } from '../supabaseClient';
import Navbar from '../reusable/Navbar';
import Footer from '../reusable/Footer';
const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  return (
    <>
      {/* Navigation Bar */}
      <Navbar></Navbar>

      {/* Homepage Content */}
      <div className="homepage-container">
        {/* Homepage Content */}
        <div className="homepage-hero">
          {/* Validly Banner */}
          <div className="validly-banner-container">
            <img src={validlyBanner} alt="Validly Banner" className="validly-banner" />
          </div>
          <h1>
           Validate Your Business Idea<br />In <span className="gradient-text">Minutes</span>, Not Months.
          </h1>
          <p>Validate your crazy business ideas in real-time to improve growth, deliverability, reduce competition, and take over markets.</p>
          <div className="homepage-hero-buttons">
            <button className="primary" onClick={() => user ? navigate('/validate') : navigate('/signup')}>Get started →</button>
            <button className="secondary" onClick= {() => navigate('/under-construction')}>Learn more →</button>
          </div>
          <div className="build-version" role="status" aria-label="Current build version">
            <span className="build-dot" aria-hidden="true"></span>
            <span className="build-label">Early Access</span>
            <span className="build-number">Build v1.00</span>
          </div>
        </div>




      </div>

      {/* Footer */}
     <Footer></Footer>
    </>
  );
};

export default HomePage; 
