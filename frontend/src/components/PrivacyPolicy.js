import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../reusable/Navbar';
import Footer from '../reusable/Footer';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      
      <div className="privacy-container">
        <button className="back-link" onClick={() => navigate('/')}>← Back to Home</button>
        
        <div className="privacy-content">
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-last-updated">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="privacy-section">
            <h2>1. Introduction</h2>
            <p>
              Validly ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our startup validation platform and services.
            </p>
          </div>

          <div className="privacy-section">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We may collect personal information that you provide directly to us, including:</p>
            <ul>
              <li>Name and contact information (email address)</li>
              <li>Account credentials and profile information</li>
              <li>Startup ideas and business information</li>
              <li>Payment and billing information</li>
              <li>Communication preferences</li>
            </ul>

            <h3>2.2 Usage Information</h3>
            <p>We automatically collect certain information about your use of our services:</p>
            <ul>
              <li>Log data and device information</li>
              <li>Usage patterns and analytics</li>
              <li>IP address and location data</li>
              <li>Browser type and version</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Process your startup validation requests</li>
              <li>Generate market analysis and insights</li>
              <li>Improve our platform and user experience</li>
              <li>Send important updates and notifications</li>
              <li>Process payments and manage subscriptions</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>4. Information Sharing and Disclosure</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>5. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
          </div>

          <div className="privacy-section">
            <h2>6. Data Retention</h2>
            <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. You may request deletion of your account and associated data at any time.</p>
          </div>

          <div className="privacy-section">
            <h2>7. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and review your personal information</li>
              <li>Update or correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Control cookie preferences</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.</p>
          </div>

          <div className="privacy-section">
            <h2>9. Third-Party Services</h2>
            <p>Our platform may integrate with third-party services (such as payment processors and analytics tools). These services have their own privacy policies, and we encourage you to review them.</p>
          </div>

          <div className="privacy-section">
            <h2>10. Children's Privacy</h2>
            <p>Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>
          </div>

          <div className="privacy-section">
            <h2>11. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable laws.</p>
          </div>

          <div className="privacy-section">
            <h2>12. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our platform and updating the "Last updated" date.</p>
          </div>

          <div className="privacy-section">
            <h2>13. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us at:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> contact@validlyapp.com</p>
              <p><strong>Address:</strong> Validly.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PrivacyPolicy;
