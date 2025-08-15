import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiBriefcase, FiTrendingUp, FiTarget, FiUsers, FiMessageSquare, FiDollarSign, FiExternalLink } from 'react-icons/fi';
import './IdeaComparisonPage.css';

const IdeaComparisonPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedIdeas } = location.state || {};
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedIdeas || selectedIdeas.length !== 2) {
      navigate('/profile');
      return;
    }

    // For now, we'll use the ideas passed from the profile page
    // In a real implementation, you might want to fetch them from the database
    setIdeas(selectedIdeas);
    setLoading(false);
  }, [selectedIdeas, navigate]);

  const getScoreClass = (score) => {
    if (score >= 8) return 'score-high';
    if (score >= 6) return 'score-medium';
    return 'score-low';
  };

  const getScoreClass2 = (score) => {
    // For competitiveness, high scores are red (bad), low scores are green (good)
    if (score >= 8) return 'score-low'; // High competition = bad = red
    if (score >= 6) return 'score-medium';
    return 'score-high'; // Low competition = good = green
  };

  if (loading) {
    return <div className="comparison-loading">Loading comparison...</div>;
  }

  if (!ideas || ideas.length !== 2) {
    return (
      <div className="comparison-error">
        <p>Invalid comparison data. Please select exactly 2 ideas to compare.</p>
        <button onClick={() => navigate('/profile')}>Back to Profile</button>
      </div>
    );
  }

  const [idea1, idea2] = ideas;

  return (
    <div className="comparison-container">
      <div className="comparison-header">
        <button className="back-button" onClick={() => navigate('/profile')}>
          <FiChevronLeft /> Back to Profile
        </button>
        <h1>Idea Comparison</h1>
        <p>Compare your startup ideas side by side</p>
      </div>

      <div className="comparison-grid">
        {/* Idea Titles */}
        <div className="comparison-section-header">
          <div className="idea-title idea1">
            <h2>{idea1.title}</h2>
            <span className="idea-date">{new Date(idea1.created_at).toLocaleDateString()}</span>
          </div>
          <div className="idea-title idea2">
            <h2>{idea2.title}</h2>
            <span className="idea-date">{new Date(idea2.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Final Comparison Score */}
        <div className="comparison-section">
          <h3>Overall Comparison Score</h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <div className="final-score-section">
                <h4>Combined Score</h4>
                <div className={`score-breakdown ${(() => {
                  // Calculate overall score using same logic as ResultsOverview
                  const calculateOverallScore = (analysis) => {
                    if (!analysis) return 0;
                    
                    // Get individual scores and normalize to 0-1
                    const demandScore = (analysis.score || 0) / 10;
                    const competitivenessScore = (analysis.feasibilityscore || 0) / 10;
                    
                    // Invert competitiveness score since lower competition is better
                    const invertedCompetitivenessScore = 1 - competitivenessScore;
                    
                    // Check if personalized status is active before including founder score
                    const isPersonalized = analysis.personalizedstatus;
                    const founderScore = isPersonalized ? (analysis.founderfitscore || 0) / 10 : 0;
                    
                    // Calculate weighted average based on whether personalized status is active
                    let overallScore;
                    if (isPersonalized) {
                      // With founder fit: 40% demand, 40% competitiveness (inverted), 20% founder fit
                      overallScore = (demandScore * 0.4 + invertedCompetitivenessScore * 0.4 + founderScore * 0.2);
                    } else {
                      // Without founder fit: 50% demand, 50% competitiveness (inverted)
                      overallScore = (demandScore * 0.5 + invertedCompetitivenessScore * 0.5);
                    }
                    
                    return Math.round(overallScore * 10) / 10; // Round to 1 decimal place
                  };
                  
                  const score1 = calculateOverallScore(idea1.analysis);
                  const score2 = calculateOverallScore(idea2.analysis);
                  
                  if (score1 === 0 && score2 === 0) return '';
                  
                  return score1 > score2 ? 'winner' : '';
                })()}`}>
                  <p><strong>Market Demand:</strong> {idea1.analysis?.score || 'N/A'}/10</p>
                  <p><strong>Market Competitiveness:</strong> {idea1.analysis?.feasibilityscore || 'N/A'}/10</p>
                  {idea1.analysis?.personalizedstatus && (
                    <p><strong>Founder Fit:</strong> {idea1.analysis?.founderfitscore || 'N/A'}/10</p>
                  )}
                  <div className="final-score">
                    <span className="final-score-value">
                      {(() => {
                        // Calculate overall score using same logic as ResultsOverview
                        const calculateOverallScore = (analysis) => {
                          if (!analysis) return 0;
                          
                          // Get individual scores and normalize to 0-1
                          const demandScore = (analysis.score || 0) / 10;
                          const competitivenessScore = (analysis.feasibilityscore || 0) / 10;
                          
                          // Invert competitiveness score since lower competition is better
                          const invertedCompetitivenessScore = 1 - competitivenessScore;
                          
                          // Check if personalized status is active before including founder score
                          const isPersonalized = analysis.personalizedstatus;
                          const founderScore = isPersonalized ? (analysis.founderfitscore || 0) / 10 : 0;
                          
                          // Calculate weighted average based on whether personalized status is active
                          let overallScore;
                          if (isPersonalized) {
                            // With founder fit: 40% demand, 40% competitiveness (inverted), 20% founder fit
                            overallScore = (demandScore * 0.4 + invertedCompetitivenessScore * 0.4 + founderScore * 0.2);
                          } else {
                            // Without founder fit: 50% demand, 50% competitiveness (inverted)
                            overallScore = (demandScore * 0.5 + invertedCompetitivenessScore * 0.5);
                          }
                          
                          return Math.round(overallScore * 10) / 10; // Round to 1 decimal place
                        };
                        
                        const score = calculateOverallScore(idea1.analysis);
                        if (score === 0) return 'N/A';
                        return score.toFixed(1);
                      })()}
                    </span>
                    <span className="final-score-label">Overall Score (0-1)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="idea-content idea2">
              <div className="final-score-section">
                <h4>Combined Score</h4>
                <div className={`score-breakdown ${(() => {
                  // Calculate overall score using same logic as ResultsOverview
                  const calculateOverallScore = (analysis) => {
                    if (!analysis) return 0;
                    
                    // Get individual scores and normalize to 0-1
                    const demandScore = (analysis.score || 0) / 10;
                    const competitivenessScore = (analysis.feasibilityscore || 0) / 10;
                    
                    // Invert competitiveness score since lower competition is better
                    const invertedCompetitivenessScore = 1 - competitivenessScore;
                    
                    // Check if personalized status is active before including founder score
                    const isPersonalized = analysis.personalizedstatus;
                    const founderScore = isPersonalized ? (analysis.founderfitscore || 0) / 10 : 0;
                    
                    // Calculate weighted average based on whether personalized status is active
                    let overallScore;
                    if (isPersonalized) {
                      // With founder fit: 40% demand, 40% competitiveness (inverted), 20% founder fit
                      overallScore = (demandScore * 0.4 + invertedCompetitivenessScore * 0.4 + founderScore * 0.2);
                    } else {
                      // Without founder fit: 50% demand, 50% competitiveness (inverted)
                      overallScore = (demandScore * 0.5 + invertedCompetitivenessScore * 0.5);
                    }
                    
                    return Math.round(overallScore * 10) / 10; // Round to 1 decimal place
                  };
                  
                  const score1 = calculateOverallScore(idea1.analysis);
                  const score2 = calculateOverallScore(idea2.analysis);
                  
                  if (score1 === 0 && score2 === 0) return '';
                  
                  return score2 > score1 ? 'winner' : '';
                })()}`}>
                  <p><strong>Market Demand:</strong> {idea2.analysis?.score || 'N/A'}/10</p>
                  <p><strong>Market Competitiveness:</strong> {idea2.analysis?.feasibilityscore || 'N/A'}/10</p>
                  {idea2.analysis?.personalizedstatus && (
                    <p><strong>Founder Fit:</strong> {idea2.analysis?.founderfitscore || 'N/A'}/10</p>
                  )}
                  <div className="final-score">
                    <span className="final-score-value">
                      {(() => {
                        // Calculate overall score using same logic as ResultsOverview
                        const calculateOverallScore = (analysis) => {
                          if (!analysis) return 0;
                          
                          // Get individual scores and normalize to 0-1
                          const demandScore = (analysis.score || 0) / 10;
                          const competitivenessScore = (analysis.feasibilityscore || 0) / 10;
                          
                          // Invert competitiveness score since lower competition is better
                          const invertedCompetitivenessScore = 1 - competitivenessScore;
                          
                          // Check if personalized status is active before including founder score
                          const isPersonalized = analysis.personalizedstatus;
                          const founderScore = isPersonalized ? (analysis.founderfitscore || 0) / 10 : 0;
                          
                          // Calculate weighted average based on whether personalized status is active
                          let overallScore;
                          if (isPersonalized) {
                            // With founder fit: 40% demand, 40% competitiveness (inverted), 20% founder fit
                            overallScore = (demandScore * 0.4 + invertedCompetitivenessScore * 0.4 + founderScore * 0.2);
                          } else {
                            // Without founder fit: 50% demand, 50% competitiveness (inverted)
                            overallScore = (demandScore * 0.5 + invertedCompetitivenessScore * 0.5);
                          }
                          
                          return Math.round(overallScore * 10) / 10; // Round to 1 decimal place
                        };
                        
                        const score = calculateOverallScore(idea2.analysis);
                        if (score === 0) return 'N/A';
                        return score.toFixed(1);
                      })()}
                    </span>
                    <span className="final-score-label">Overall Score (0-1)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Original Questions */}
        <div className="comparison-section">
          <h3>Original Idea</h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <p>"{idea1.question}"</p>
            </div>
            <div className="idea-content idea2">
              <p>"{idea2.question}"</p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="comparison-section">
          <h3><FiBriefcase className="section-icon" /> Overview</h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <p>{idea1.analysis.overview}</p>
            </div>
            <div className="idea-content idea2">
              <p>{idea2.analysis.overview}</p>
            </div>
          </div>
        </div>

        {/* Market Demand */}
        <div className="comparison-section">
          <h3>
            <FiTrendingUp className="section-icon" /> 
            Market Demand
          </h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <p><strong>Market Demand Score:</strong> <span className={`score-badge demand ${getScoreClass(idea1.analysis?.score)}`}>{idea1.analysis?.score || 'N/A'}/10</span></p>
              <p><strong>Summary:</strong> {idea1.analysis?.summary || 'No summary available'}</p>
              <p><strong>Details:</strong> {idea1.analysis?.details || 'No details available'}</p>
              
              <div className="subsection">
                <h4>Customer Pain Points</h4>
                <p><strong>Primary:</strong> {idea1.analysis.marketDemand?.painPoints?.primaryPainPoint || 'Not specified'}</p>
                <p><strong>Urgency:</strong> {idea1.analysis.marketDemand?.painPoints?.urgency || 'Not specified'}</p>
                <p><strong>Evidence:</strong> {idea1.analysis.marketDemand?.painPoints?.evidence || 'Not specified'}</p>
              </div>
              
              <div className="subsection">
                <h4>Market Timing & Trends</h4>
                <p><strong>Readiness:</strong> {idea1.analysis.marketDemand?.timingTrends?.marketReadiness || 'Not specified'}</p>
                <p><strong>Trends:</strong> {idea1.analysis.marketDemand?.timingTrends?.emergingTrends || 'Not specified'}</p>
                <p><strong>Assessment:</strong> {idea1.analysis.marketDemand?.timingTrends?.timingAssessment || 'Not specified'}</p>
              </div>
            </div>
            <div className="idea-content idea2">
              <p><strong>Market Demand Score:</strong> <span className={`score-badge demand ${getScoreClass(idea2.analysis?.score)}`}>{idea2.analysis?.score || 'N/A'}/10</span></p>
              <p><strong>Summary:</strong> {idea2.analysis?.summary || 'No summary available'}</p>
              <p><strong>Details:</strong> {idea2.analysis?.details || 'No details available'}</p>
              
              <div className="subsection">
                <h4>Customer Pain Points</h4>
                <p><strong>Primary:</strong> {idea2.analysis.marketDemand?.painPoints?.primaryPainPoint || 'Not specified'}</p>
                <p><strong>Urgency:</strong> {idea2.analysis.marketDemand?.painPoints?.urgency || 'Not specified'}</p>
                <p><strong>Evidence:</strong> {idea2.analysis.marketDemand?.painPoints?.evidence || 'Not specified'}</p>
              </div>
              
              <div className="subsection">
                <h4>Market Timing & Trends</h4>
                <p><strong>Readiness:</strong> {idea2.analysis.marketDemand?.timingTrends?.marketReadiness || 'Not specified'}</p>
                <p><strong>Trends:</strong> {idea2.analysis.marketDemand?.timingTrends?.emergingTrends || 'Not specified'}</p>
                <p><strong>Assessment:</strong> {idea2.analysis.marketDemand?.timingTrends?.timingAssessment || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Competitors */}
        <div className="comparison-section">
          <h3>
            <FiTarget className="section-icon" /> 
            Market Competitiveness
          </h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <p><strong>Competitiveness Score:</strong> <span className={`score-badge competitiveness ${getScoreClass2(idea1.analysis?.feasibilityscore)}`}>{idea1.analysis?.feasibilityscore || 'N/A'}/10</span></p>
              {idea1.analysis.competitors.map((comp, i) => (
                <div key={i} className="competitor-item">
                  <div className="competitor-title">
                    <strong>{comp.name}</strong>
                    <span className={`popularity-badge ${comp.popularity?.toLowerCase()}`}>{comp.popularity} Pop.</span>
                  </div>
                  <p>{comp.description}</p>
                  <p><strong>Pricing:</strong> {comp.pricing}</p>
                  <h5>Strengths</h5>
                  <ul>{comp.pros.map((pro, j) => <li key={j}>{pro}</li>)}</ul>
                  <h5>Weaknesses</h5>
                  <ul>{comp.weaknesses.map((weak, j) => <li key={j}>{weak}</li>)}</ul>
                </div>
              ))}
            </div>
            <div className="idea-content idea2">
              <p><strong>Competitiveness Score:</strong> <span className={`score-badge competitiveness ${getScoreClass2(idea2.analysis?.feasibilityscore)}`}>{idea2.analysis?.feasibilityscore || 'N/A'}/10</span></p>
              {idea2.analysis.competitors.map((comp, i) => (
                <div key={i} className="competitor-item">
                  <div className="competitor-title">
                    <strong>{comp.name}</strong>
                    <span className={`popularity-badge ${comp.popularity?.toLowerCase()}`}>{comp.popularity} Pop.</span>
                  </div>
                  <p>{comp.description}</p>
                  <p><strong>Pricing:</strong> {comp.pricing}</p>
                  <h5>Strengths</h5>
                  <ul>{comp.pros.map((pro, j) => <li key={j}>{pro}</li>)}</ul>
                  <h5>Weaknesses</h5>
                  <ul>{comp.weaknesses.map((weak, j) => <li key={j}>{weak}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="comparison-section">
          <h3><FiUsers className="section-icon" /> Target Audience</h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              {idea1.analysis.targetAudience.map((aud, i) => (
                <div key={i} className="subsection">
                  <h4>{aud.group}</h4>
                  <h5>Potential Online Hangouts:</h5>
                  <ul>
                    {aud.onlineDestinations.map((dest, j) => (
                      <li key={j}>{dest.name} ({dest.type}) - {dest.description}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="idea-content idea2">
              {idea2.analysis.targetAudience.map((aud, i) => (
                <div key={i} className="subsection">
                  <h4>{aud.group}</h4>
                  <h5>Potential Online Hangouts:</h5>
                  <ul>
                    {aud.onlineDestinations.map((dest, j) => (
                      <li key={j}>{dest.name} ({dest.type}) - {dest.description}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Pitch */}
        <div className="comparison-section">
          <h3><FiMessageSquare className="section-icon" /> Professional Pitch</h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <p>{idea1.analysis.pitch}</p>
            </div>
            <div className="idea-content idea2">
              <p>{idea2.analysis.pitch}</p>
            </div>
          </div>
        </div>

        {/* Revenue Models */}
        <div className="comparison-section">
          <h3><FiDollarSign className="section-icon" /> Revenue Model Suggestions</h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <ul>
                {idea1.analysis.revenueModels.map((model, i) => <li key={i}>{model}</li>)}
              </ul>
            </div>
            <div className="idea-content idea2">
              <ul>
                {idea2.analysis.revenueModels.map((model, i) => <li key={i}>{model}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* MVP Features */}
        <div className="comparison-section">
          <h3><FiExternalLink className="section-icon" /> MVP Feature Set</h3>
          <div className="comparison-content">
            <div className="idea-content idea1">
              <div className="subsection">
                <h4>Suggested MVP Design</h4>
                <p>{idea1.analysis.mvpDesign}</p>
              </div>
              <div className="subsection">
                <h4>Feature Prioritization</h4>
                <ul className="mvp-feature-list">
                  {idea1.analysis.mvpFeatures.map((feat, i) => (
                    <li key={i}>
                      <span>{feat.feature}</span>
                      <div className="mvp-badges">
                        <span className={`mvp-badge priority-${feat.priority?.toLowerCase()}`}>{feat.priority} Priority</span>
                        <span className={`mvp-badge effort-${feat.effort?.toLowerCase()}`}>{feat.effort} Effort</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="idea-content idea2">
              <div className="subsection">
                <h4>Suggested MVP Design</h4>
                <p>{idea2.analysis.mvpDesign}</p>
              </div>
              <div className="subsection">
                <h4>Feature Prioritization</h4>
                <ul className="mvp-feature-list">
                  {idea2.analysis.mvpFeatures.map((feat, i) => (
                    <li key={i}>
                      <span>{feat.feature}</span>
                      <div className="mvp-badges">
                        <span className={`mvp-badge priority-${feat.priority?.toLowerCase()}`}>{feat.priority} Priority</span>
                        <span className={`mvp-badge effort-${feat.effort?.toLowerCase()}`}>{feat.effort} Effort</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IdeaComparisonPage; 