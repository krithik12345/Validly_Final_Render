// AudienceResults.js
import React, { useState, useEffect } from 'react';
import {
  FiUsers, FiCheckCircle, FiLink,
  FiMessageSquare, FiCopy
} from 'react-icons/fi';
import '../components/ValidatePage.css';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://validly-final-render.onrender.com';

const AudienceResults = ({ analysis, handleCopyPitch, getScoreColor, ensureArray, input }) => {
  const [surveyLink, setSurveyLink] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Listen for popup message with result
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.surveyDone) {
        if (e.data.copyUrl) {
          setSurveyLink(e.data.copyUrl);
          setError(null);
        } else {
          setError(e.data.error || 'Survey creation failed.');
        }
        setLoading(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const startPopupFlow = () => {
    setSurveyLink(null);
    setError(null);
    setLoading(true);

    // Encode `input` into OAuth `state`
    const statePayload = { input: input || '' };
    // btoa requires ASCII. Wrap in encodeURIComponent for safety.
    const state = btoa(encodeURIComponent(JSON.stringify(statePayload)));

    const url = `${BACKEND}/survey/auth?state=${encodeURIComponent(state)}`;

    const popup = window.open(
      url,
      'ValidlyGoogleOAuth',
      'width=600,height=600'
    );
    if (!popup) {
      setError('Please enable popups for this site.');
      setLoading(false);
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
                      className={`destination-button ${(dest.type || 'Other').toLowerCase().replace(' ', '-')}`}
                    >
                      <FiLink className="destination-icon" />
                      <div className="destination-info">
                        <span className="destination-name">{dest.name || 'Unknown'}</span>
                        <span className="destination-type">{dest.type || 'Other'}</span>
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

      {/* Survey */}
      <div className="survey-btn-container">
        {!surveyLink && (
          <button
            className="survey-btn"
            onClick={startPopupFlow}
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
