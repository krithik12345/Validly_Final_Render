import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../reusable/Navbar';
import Footer from '../reusable/Footer';
import './TOS.css';

const TOS = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      
      <div className="tos-container">
        <button className="back-link" onClick={() => navigate('/')}>← Back to Home</button>
        
        <div className="tos-content">
          <h1 className="tos-title">Terms of Service</h1>
          <p className="tos-last-updated">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="tos-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Validly ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>

          <div className="tos-section">
            <h2>2. Description of Service</h2>
            <p>
              Validly is an AI-powered startup validation platform that provides market analysis, competitor research, and business insights. Our service helps entrepreneurs validate their business ideas through data-driven analysis and recommendations.
            </p>
          </div>

          <div className="tos-section">
            <h2>3. User Accounts</h2>
            <h3>3.1 Account Creation</h3>
            <p>To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration.</p>
            
            <h3>3.2 Account Security</h3>
            <p>You are responsible for safeguarding your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.</p>
          </div>

          <div className="tos-section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for commercial purposes without proper authorization</li>
            </ul>
          </div>

          <div className="tos-section">
            <h2>5. Intellectual Property</h2>
            <h3>5.1 Our Rights</h3>
            <p>The Service and its original content, features, and functionality are owned by Validly and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
            
            <h3>5.2 Your Content</h3>
            <p>You retain ownership of any content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive license to use, reproduce, and distribute your content in connection with the Service.</p>
          </div>

          <div className="tos-section">
            <h2>6. Privacy and Data</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
            </p>
          </div>

          <div className="tos-section">
            <h2>7. Subscription and Payment</h2>
            <h3>7.1 Subscription Plans</h3>
            <p>We offer various subscription plans with different features and pricing. All subscriptions are billed in advance on a recurring basis.</p>
            
            <h3>7.2 Payment Terms</h3>
            <p>Payment is due at the time of subscription. We reserve the right to modify our pricing with 30 days' notice. Unpaid accounts may be suspended or terminated.</p>
            
            <h3>7.3 Cancellation</h3>
            <p>You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. No refunds are provided for partial periods.</p>
          </div>

          <div className="tos-section">
            <h2>8. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </div>

          <div className="tos-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL VALIDLY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </div>

          <div className="tos-section">
            <h2>10. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Validly and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service.
            </p>
          </div>

          <div className="tos-section">
            <h2>11. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>
          </div>

          <div className="tos-section">
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Validly operates, without regard to its conflict of law provisions.
            </p>
          </div>

          <div className="tos-section">
            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div className="tos-section">
            <h2>14. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us at:</p>
            <div className="contact-info">
              <p><strong>Email:</strong> validly@gmail.com</p>
              <p><strong>Address:</strong> Validly, Inc.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default TOS;
