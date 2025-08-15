import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiX, FiCheck, FiDownload, FiTrendingUp, FiTarget, FiUsers, FiCheckCircle, FiDollarSign, FiExternalLink, FiAlertCircle, FiLink, FiMessageSquare, FiCopy, FiClock, FiSave, FiUserCheck, FiChevronsUp, FiChevronsDown } from 'react-icons/fi';
import '../components/ValidatePage.css';

const DemandResults = (props) => {
  const { analysis, painPoints, timingTrends, getScoreColor } = props;
  const [showMore, setShowMore] = useState(false);
  const contentRef = useRef(null);

  return (
    <div className="results-section market-demand">
      <div className="market-demand-header">
        <span className="market-demand-icon-bg"><FiTrendingUp className="market-demand-icon" /></span>
        <h3>Market Demand</h3>
        <span className={`score-badge ${getScoreColor(analysis.score)}`}>{analysis.score}/10</span>
      </div>
      
      <p className="market-demand-summary">{analysis.summary || 'No summary available'}</p>

      <div className="button-wrapper">
        <button className="dropdown-button" onClick={() => setShowMore(!showMore)}>
          <b>Read {showMore ? 'Less' : 'More'}</b>
                            {showMore ? <FiChevronsUp className="chevron-icon" /> : <FiChevronsDown className="chevron-icon" />}
        </button>
      </div>

      <div
        className={`expandable-wrapper ${showMore ? 'show' : ''}`}
        ref={contentRef}
      >
        <p className="market-demand-details">{analysis.details || 'No details available'}</p>

        {/* Customer Pain Points Subsection */}
        <div className="subsection-divider" />
        <div className="pain-points-section">
          <div className="pain-points-header">
            <FiAlertCircle className="pain-points-icon" />
            <span>Customer Pain Points</span>
          </div>
          <div className="pain-points-content">
            <div className="pain-point-card">
              <strong>Primary Pain Point:</strong> {painPoints.primaryPainPoint || 'Not specified'}
            </div>
            <div className="pain-point-card">
              <strong>Problem Urgency:</strong> {painPoints.urgency || 'Not specified'}
            </div>
            <div className="pain-point-card">
              <strong>Evidence of Demand:</strong> {painPoints.evidence || 'Not specified'}
            </div>
          </div>
        </div>

        {/* Market Timing & Trends Subsection */}
        <div className="subsection-divider" />
        <div className="timing-trends-section">
          <div className="timing-trends-header">
            <FiClock className="timing-trends-icon" />
            <span>Market Timing & Trends</span>
          </div>
          <div className="timing-trends-content">
            <div className="timing-trend-card">
              <strong>Market Readiness:</strong> {timingTrends.marketReadiness || 'Not specified'}
            </div>
            <div className="timing-trend-card">
              <strong>Emerging Trends:</strong> {timingTrends.emergingTrends || 'Not specified'}
            </div>
            <div className="timing-trend-card">
              <strong>Timing Assessment:</strong> {timingTrends.timingAssessment || 'Not specified'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandResults;
