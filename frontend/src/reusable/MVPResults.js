import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiX, FiCheck, FiDownload, FiTrendingUp, FiTarget, FiUsers, FiCheckCircle, FiDollarSign, FiExternalLink, FiAlertCircle, FiLink, FiMessageSquare, FiCopy, FiClock, FiSave, FiUserCheck, FiChevronsUp, FiChevronsDown, FiZap, FiShield, FiStar, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import '../components/ValidatePage.css';

const MVPResults = (props) => {
    const analysis = props.analysis;
    const ensureArray = props.ensureArray;
    const [expandedFeatures, setExpandedFeatures] = useState({});

    const toggleFeature = (featureIndex) => {
        setExpandedFeatures(prev => ({
            ...prev,
            [featureIndex]: !prev[featureIndex]
        }));
    };

    return (  
    <div className="results-section mvp-features">
        <div className="mvp-features-header">
          <span className="mvp-features-icon-bg"><FiExternalLink className="mvp-features-icon" /></span>
          <h3>MVP Feature Set</h3>
          <span className="mvp-subtitle">Differentiated & Competitive</span>
        </div>
        <div className="mvp-design-section">
          <div className="mvp-design-title">Suggested MVP Design</div>
          <div className="mvp-design-card">{analysis.mvpDesign || 'No MVP design available'}</div>
        </div>
        <div className="mvp-features-grid">
          {analysis.mvpFeatures && analysis.mvpFeatures.length > 0 ? (
            analysis.mvpFeatures.map((feat, idx) => (
              <div className="mvp-feature-card" key={idx}>
                <div className="mvp-feature-header">
                  <div className="mvp-feature-title">
                    <FiCheckCircle className="mvp-feature-check" />
                    <span className="feature-name">{feat.feature || 'Unknown feature'}</span>
                  </div>
                  <div className="mvp-feature-badges">
                    <span className={`priority-badge ${(feat.priority || 'Low').toLowerCase().replace(' ', '-')}`}>
                      {feat.priority || 'Low'} Priority
                    </span>
                    <span className={`effort-badge ${(feat.effort || 'Low').toLowerCase().replace(' ', '-')}`}>
                      {feat.effort || 'Low'} Effort
                    </span>
                  </div>
                </div>
                
                <div className="mvp-feature-content">
                  <div className="differentiation-section">
                    <div className="differentiation-header">
                      <FiZap className="differentiation-icon" />
                      <span>Differentiation Factor</span>
                    </div>
                    <p>{feat.differentiationFactor || 'No differentiation factor specified'}</p>
                  </div>
                  
                  <div className="mvp-feature-details-toggle">
                    <button 
                      className="mvp-feature-toggle-btn"
                      onClick={() => toggleFeature(idx)}
                    >
                      <span>Read More</span>
                      {expandedFeatures[idx] ? (
                        <FiChevronUp className="toggle-icon" />
                      ) : (
                        <FiChevronDown className="toggle-icon" />
                      )}
                    </button>
                  </div>
                  
                  {expandedFeatures[idx] && (
                    <div className="mvp-feature-details">
                      <div className="implementation-section">
                        <div className="implementation-header">
                          <FiStar className="implementation-icon" />
                          <span>Unique Implementation</span>
                        </div>
                        <p>{feat.uniqueImplementation || 'No unique implementation specified'}</p>
                      </div>
                      
                      <div className="advantage-section">
                        <div className="advantage-header">
                          <FiShield className="advantage-icon" />
                          <span>Competitive Advantage</span>
                        </div>
                        <p>{feat.competitiveAdvantage || 'No competitive advantage specified'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-features">No MVP features available</div>
          )}
        </div>
      </div>
    );
}
 
export default MVPResults;