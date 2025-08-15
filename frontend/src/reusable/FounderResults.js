import React, { useState } from 'react';
import { FiUserCheck, FiChevronsUp, FiChevronsDown } from 'react-icons/fi';
import '../components/ValidatePage.css';

const FounderResults = (props) => {
  const { analysis, getScoreColor, ensureArray } = props;
  const [showSkills, setShowSkills] = useState(false);
  const [showSection, setShowSection] = useState({ strengths: false, weaknesses: false });

  const toggleSection = (section) => {
    setShowSection(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="results-section founderproduct">
      <div className="founderproduct-header">
        <span className="founderproduct-icon-bg"><FiUserCheck className="founderproduct-icon" /></span>
        <h3>Founder Fit</h3>
        <span className={`score-badge ${getScoreColor(analysis.founderfitscore)}`}>{analysis.founderfitscore}/10</span>
      </div>

      <p className="founderproduct-summary">{analysis.founderfit || 'No summary available'}</p>

      {/* Skills Section Toggle */}
      <div className="button-wrapper">
        <button className="dropdown-button" onClick={() => setShowSkills(prev => !prev)}>
          <b>{showSkills ? 'Hide' : 'View'} Skills</b>
          {showSkills ? (
            <FiChevronsUp className="chevron-icon" />
          ) : (
            <FiChevronsDown className="chevron-icon" />
          )}
        </button>
      </div>

      <div className={`expandable-wrapper ${showSkills ? 'show' : ''}`}>
        <div className="founderproduct-skills">
          {/* Strengths */}
          <div className="subsection-divider" />
          <div className="good-fit-header">
            <FiChevronsUp className="good-fit-icon" />
            <span>Your Strengths</span>
          </div>           
          <div className="good-fit-content">
              {ensureArray(analysis.positivefounderfit).map((fit, index) => (
                <div key={index} className="good-fit-card">
                  <strong>{fit.skill}:</strong> {fit.description || 'Not specified'}
                </div>
              ))}
          </div>

          {/* Weaknesses */}
          <div className="subsection-divider" />
          <div className="bad-fit-header">
            <FiChevronsDown className="bad-fit-icon" />
            <span>Your Weaknesses</span>
          </div>
            <div className="bad-fit-content">
              {ensureArray(analysis.negativefounderfit).map((fit, index) => (
                <div key={index} className="bad-fit-card">
                  <strong>{fit.skill}:</strong> {fit.description || 'Not specified'}
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default FounderResults;
