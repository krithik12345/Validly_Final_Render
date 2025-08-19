// AudienceResults.js
// ────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiUsers, FiCheckCircle, FiLink,
  FiMessageSquare, FiCopy
} from 'react-icons/fi';
import '../components/ValidatePage.css';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://validly-final-render.onrender.com';

const AudienceResults = ({ analysis, handleCopyPitch, getScoreColor, ensureArray, input}) => {
  const [surveyLink, setSurveyLink] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // 1) Listen for “surveyAuth” from popup to trigger createSurvey()
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.surveyAuth) createSurvey();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // 2) Create the form & get link
  const createSurvey = async (tempToken = null) => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        withCredentials: true
      };
      
      // If we have a temp token, use it in Authorization header
      if (tempToken) {
        config.headers = {
          'Authorization': `Bearer ${tempToken}`
        };
      }
      
      const res = await axios.post(
        `${BACKEND}/survey`,
        { input },
        config
      );
      setSurveyLink(res.data.copyUrl);
    } catch (err) {
      setError('Failed to create survey.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3) Entry point: check auth status first
  const handleGetSurvey = async () => {
    setError(null);
    setSurveyLink(null);
    setLoading(true);

    try {
      // Ask the server if we’re already authenticated
      await axios.get(
        `${BACKEND}/survey/status`,
        { withCredentials: true }
      );
      // 200 → go straight to create
      await createSurvey();
    } catch (err) {
      // Session auth failed, try token-based approach
      try {
        // Get a temporary token
        const tokenRes = await axios.get(
          `${BACKEND}/survey/token`,
          { withCredentials: true }
        );
        
        if (tokenRes.data.token) {
          // Use the token to create survey
          await createSurvey(tokenRes.data.token);
        } else {
          throw new Error('No token received');
        }
      } catch (tokenErr) {
        // Both session and token auth failed, open popup for OAuth
        const popup = window.open(
          `${BACKEND}/survey/auth`,
          'ValidlyGoogleOAuth',
          'width=600,height=400'
        );
        
        if (!popup) {
          setError('Please enable popups for this site.');
          setLoading(false);
        }
        // popup flow will trigger createSurvey() via postMessage
      }
    }
  };

  return (
      <div className="results-section target-audience">
      {/* Target Audience */}
      <div className="target-audience-header">
        <span className="target-audience-icon-bg">
          <FiUsers className="target-audience-icon" />
        </span>
        <h3>Target Audience</h3>
      </div>
      <div className="target-audience-list">
        {analysis.targetAudience.length > 0 ? (
          analysis.targetAudience.map((aud, idx) => (
            <div className="target-audience-item" key={idx}>
              <div className="target-audience-group">
                <FiCheckCircle className="target-audience-check" />
                <span className="target-group-name">
                  {aud.group || 'Unknown Group'}
                </span>
              </div>
              <div className="online-destinations">
                <h4>Find this audience online:</h4>
                <div className="destination-buttons">
                  {(aud.onlineDestinations || []).map((dest, di) => (
                    <a
                      key={di}
                      href={dest.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`destination-button ${
                        (dest.type || 'Other').toLowerCase().replace(' ', '-')
                      }`}
                    >
                      <FiLink className="destination-icon" />
                      <div className="destination-info">
                        <span className="destination-name">
                          {dest.name || 'Unknown'}
                        </span>
                        <span className="destination-type">
                          {dest.type || 'Other'}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No target audience information available.</p>
        )}
      </div>

      {/* Pitch Section */}
      <div className="pitch-section">
        <div className="pitch-header">
          <span className="pitch-icon-bg">
            <FiMessageSquare className="pitch-icon" />
          </span>
          <h3>Professional Pitch - Share to the Online Community!</h3>
          <button
            className="copy-pitch-btn"
            onClick={handleCopyPitch}
            title="Copy Pitch to Clipboard"
          >
            <FiCopy className="copy-icon" />
          </button>
        </div>
        <div className="pitch-content">
          <p className="pitch-paragraph">
            {analysis.pitch || 'No pitch available'}
          </p>
        </div>
      </div>

      <div className="survey-btn-container">
        {surveyLink ? null : (
          <button
            className="survey-btn"
            onClick={handleGetSurvey}
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Get a Survey Link'}
          </button>
        )}
        {surveyLink && (
          <div className="survey-link">
            <a href={surveyLink} target="_blank" rel="noopener">
              <FiLink /> {surveyLink}
            </a>
          </div>
        )}
        {error && <div className="survey-error">{error}</div>}
      </div>
    </div>
  );
};

export default AudienceResults;
