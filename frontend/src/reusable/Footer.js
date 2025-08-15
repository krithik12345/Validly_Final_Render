import React from "react";
import { useNavigate } from 'react-router-dom';
import logo from '../Clean_Validly_Logo.png';
import { FiLinkedin, FiInstagram, FiYoutube } from 'react-icons/fi';

const Footer = () => {
    const navigate = useNavigate();
    
    return (
         <footer className="footer">
                <div className="footer-content">
                  <div className="footer-col footer-brand">
                    <div className="footer-logo-row">
                      <img src={logo} alt="Validly Logo" className="footer-logo" />
                      <span className="footer-title">Validly</span>
                    </div>
                    <p className="footer-desc">Validate your business ideas in seconds with AI-powered insights, competitor analysis, and MVP recommendations.</p>
                    <div className="footer-socials">
                      <a href="https://www.instagram.com/getvalidly/" className="footer-social"><FiInstagram /></a>
                      <a href="https://www.youtube.com/channel/UCK3n67eeJ7oSLBL47lhUHaA" className="footer-social"><FiYoutube /></a>
                      <a href="https://www.linkedin.com/company/validlyai/" className="footer-social"><FiLinkedin /></a>
                    </div>
                  </div>
                  <div className="footer-col footer-links">
                    <div className="footer-links-title">Product</div>
                    <a href="/under-construction" className="footer-link">Features</a>
                    <a href="/pricing" className="footer-link" onClick={e => { e.preventDefault(); navigate('/pricing'); }}>Pricing</a>
                    <a href="/under-construction" className="footer-link">Examples</a>
                  </div>
                  <div className="footer-col footer-links">
                    <div className="footer-links-title">Company</div>
                    <a href="/under-construction" className="footer-link">About</a>
                    <a href="/privacy" className="footer-link" onClick={e => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a>
                    <a href="/tos" className="footer-link" onClick={e => { e.preventDefault(); navigate('/tos'); }}>Terms of Service</a>
                  </div>
                </div>
                <div className="footer-bottom">
                  <span>© 2025 Validly. All rights reserved.</span>
                </div>
              </footer>
      );
}
 
export default Footer;