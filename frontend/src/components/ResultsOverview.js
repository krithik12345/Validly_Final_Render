import React, { useState, useEffect } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import './ResultsOverview.css';

const ResultsOverview = ({ analysis }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedFactors, setAnimatedFactors] = useState({
    demand: 0,
    competitiveness: 0,
    founder: 0
  });

  // Calculate overall score (0-1 scale)
  const calculateOverallScore = () => {
    if (!analysis) return 0;
    
    // Get individual scores and normalize to 0-1
    const demandScore = (analysis.score || 0) / 10;
    let competitivenessScore = (analysis.feasibilityscore || 0) / 10;
    
    // Invert competitiveness score since lower competition is better (like in IdeaComparisonPage)
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

  // Calculate factor breakdown for display
  const calculateFactorBreakdown = () => {
    if (!analysis) return { factors: {}, weights: {} };
    
    const demandScore = (analysis.score || 0) / 10;
    const competitivenessScore = (analysis.feasibilityscore || 0) / 10;
    const isPersonalized = analysis.personalizedstatus;
    const founderScore = isPersonalized ? (analysis.founderfitscore || 0) / 10 : 0;
    
    let weights;
    if (isPersonalized) {
      weights = {
        demand: 0.4,
        competitiveness: 0.4,
        founder: 0.2
      };
    } else {
      weights = {
        demand: 0.5,
        competitiveness: 0.5
      };
    }
    
    return {
      factors: {
        demand: demandScore,
        competitiveness: competitivenessScore, // Keep original for display, but use inverted for overall score
        founder: founderScore
      },
      weights: weights
    };
  };

  const overallScore = calculateOverallScore();
  const factorData = calculateFactorBreakdown();
  
  // Animate the score on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(overallScore);
      setAnimatedFactors({
        demand: factorData.factors.demand,
        competitiveness: factorData.factors.competitiveness,
        founder: factorData.factors.founder
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [overallScore, factorData]);
  
  // Determine color for score
  const getScoreColor = (score) => {
    if (score >= 0.7) {
      return '#10b981'; // Green
    } else if (score >= 0.4) {
      return '#f59e0b'; // Yellow/Orange
    } else {
      return '#ef4444'; // Red
    }
  };

  // Determine color for competitiveness score (inverted logic - like in IdeaComparisonPage)
  const getCompetitivenessScoreColor = (score) => {
    // Invert the score for color logic: 1 = green, 10 = red
    const invertedScore = 1 - score;
    
    if (invertedScore >= 0.7) {
      return '#10b981'; // Green (low competition = good)
    } else if (invertedScore >= 0.4) {
      return '#f59e0b'; // Yellow/Orange (moderate competition)
    } else {
      return '#ef4444'; // Red (high competition = bad)
    }
  };

  // Custom score badge function for 0-1 scale
  const getScoreBadge = (score) => {
    const scoreOutOf10 = Math.round(score * 10);
    const color = getScoreColor(score);
    
    return (
      <span 
        className="score-badge" 
        style={{ 
          backgroundColor: color === '#10b981' ? '#bbf7d0' : 
                          color === '#f59e0b' ? '#fef3c7' : '#fee2e2',
          color: color === '#10b981' ? '#15803d' : 
                 color === '#f59e0b' ? '#b45309' : '#b91c1c'
        }}
      >
        {scoreOutOf10}/10
      </span>
    );
  };

  // Scroll to section function
  const scrollToSection = (sectionClass) => {
    const element = document.querySelector(`.${sectionClass}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const isPersonalized = analysis?.personalizedstatus;

  return (
    <div className="results-overview">
      <div className="results-overview-header">

        <h3>Overall Idea Score&nbsp;&nbsp; {getScoreBadge(overallScore)}</h3>

      </div>
      
      <div className="results-overview-content">
        <p className="market-demand-summary">
          This overall score evaluates your idea's potential based on market demand and market competitiveness, 
          {isPersonalized ? ' and your founder fit.' : '.'}
        </p>
        
        {/* Factor Breakdown - Now takes full width */}
        <div className="factor-breakdown-container">
          <div className="factor-breakdown">
            <div className="factor-bars">
              <div 
                className="factor-bar-item clickable"
                onClick={() => scrollToSection('market-demand')}
              >
                <div className="factor-header">
                  <strong>Market Demand</strong>
                  <span className="factor-score">{Math.round(factorData.factors.demand * 100)}%</span>
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-fill"
                    style={{ 
                      width: `${animatedFactors.demand * 100}%`,
                      backgroundColor: getScoreColor(factorData.factors.demand)
                    }}
                  />
                </div>
                <span className="factor-weight">({Math.round(factorData.weights.demand * 100)}% weight)</span>
              </div>
              
              <div 
                className="factor-bar-item clickable"
                onClick={() => scrollToSection('competitors')}
              >
                <div className="factor-header">
                  <strong>Market Competitiveness</strong>
                  <span className="factor-score">{Math.round(factorData.factors.competitiveness * 100)}%</span>
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-fill"
                    style={{ 
                      width: `${animatedFactors.competitiveness * 100}%`,
                      backgroundColor: getCompetitivenessScoreColor(factorData.factors.competitiveness)
                    }}
                  />
                </div>
                <span className="factor-weight">({Math.round(factorData.weights.competitiveness * 100)}% weight)</span>
              </div>
              
              {isPersonalized && (
                <div 
                  className="factor-bar-item clickable"
                  onClick={() => scrollToSection('founderproduct')}
                >
                  <div className="factor-header">
                    <strong>Founder Fit</strong>
                    <span className="factor-score">{Math.round(factorData.factors.founder * 100)}%</span>
                  </div>
                  <div className="factor-bar">
                    <div 
                      className="factor-fill"
                      style={{ 
                        width: `${animatedFactors.founder * 100}%`,
                        backgroundColor: getScoreColor(factorData.factors.founder)
                      }}
                    />
                  </div>
                  <span className="factor-weight">({Math.round(factorData.weights.founder * 100)}% weight)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsOverview; 