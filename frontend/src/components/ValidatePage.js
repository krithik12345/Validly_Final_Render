import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiClipboard, FiChevronDown } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { DeepResearchGuard } from '../components/FeatureGuard';
import './ValidatePage.css';

const modeList = [
  'Quick Search',
  'Deep Research'
];

  
const ValidatePage = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [personalized, setPersonalized] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modeList[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(false);
  const [upgradeType, setUpgradeType] = useState(null); // 'deep-research' or 'personalized-analysis'
  const dropdownRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const navigate = useNavigate();
  const maxWords = 500;
  const maxChars = 3500;
  let parsed; // its here because the error block cant access it otherwise 

  // Use the feature access hook
  const { canUseDeepResearch, userPlan } = useFeatureAccess();

  // Show all models to all users, but handle access control on selection
  const availableModels = modeList;

  // Debug logging
  console.log('User Plan:', userPlan);
  console.log('Can use Deep Research:', canUseDeepResearch());
  console.log('Available Models:', availableModels);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, country, state, city, education_level, background, technical_skills, previous_experience, startup_name, startup_description, industry, customer_type, stage, team_size, tech_stack, funding')
            .eq('id', user.id)
            .single();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleMessageChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    setWordCount(countWords(newMessage));
    setCharCount(newMessage.length);
  };

  const getWordCountColor = () => {
    if (wordCount > maxWords) return '#dc2626'; // red
    if (wordCount > maxWords * 0.8) return '#f59e0b'; // amber
    return '#6b7280'; // gray
  };

  const getCharCountColor = () => {
    if (charCount > maxChars) return '#dc2626'; // red
    if (charCount > maxChars * 0.8) return '#f59e0b'; // amber
    return '#6b7280'; // gray
  };

  const startProgressSimulation = () => {
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current);
          return 90; // Cap at 90% until we get the actual response
        }
        return prev + Math.random() * 15; // Random increment between 0-15
      });
    }, 500); // Update every 500ms
  };

  const stopProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(100);
  };

  // Handle model selection with access control
  const handleModelSelection = (model) => {
    if (model === 'Deep Research' && !canUseDeepResearch()) {
      setUpgradeType('deep-research');
      setShowUpgradeNotification(true);
      return;
    }
    setSelectedModel(model);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (wordCount > maxWords) return;
    setLoading(true);
    setError(null);
    startProgressSimulation();
    
    try {
      const requestBody = {
        message,
        model: selectedModel,
        personalized
      };

      // Include user profile data if personalized analysis is enabled
      if (personalized && userProfile) {
        requestBody.userProfile = {
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          location: {
            country: userProfile.country,
            state: userProfile.state,
            city: userProfile.city
          },
          background: userProfile.background,
          technicalSkills: userProfile.technical_skills,
          previousExperience: userProfile.previous_experience,
          startupName: userProfile.startup_name,
          startupDescription: userProfile.startup_description,
          industry: userProfile.industry,
          customerType: userProfile.customer_type,
          stage: userProfile.stage,
          teamSize: userProfile.team_size,
          techStack: userProfile.tech_stack,
          funding: userProfile.funding
        };
      }

      const response = await axios.post('https://validly-final-render.onrender.com/api/chat', requestBody);
      let parsed = response.data.reply;

      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch (e) {
          console.error('Error parsing response:', e);
          setError('Received invalid response format.');
          setLoading(false);
          stopProgressSimulation();
          return;
        }
      }
      if (parsed?.title && parsed?.marketDemand && parsed?.competitors) {
        stopProgressSimulation();
        setLoading(false);

        navigate('/results', {
          replace: true,
          state: { analysis: parsed, input: message }
        });

  // Immediately hard-reload the browser on that new URL
  // (this only happens once, right here)
//   window.location.reload();
      } else {
        stopProgressSimulation();
        setLoading(false);
        setError('The validation result was incomplete or malformed.');
      }

    } catch (err) {
      stopProgressSimulation();
      setLoading(false);
      if (parsed === 'INAPPROPRIATECONTENT') {
        setError('Your content has been flagged for inappropriate content.')
      }
      else if (parsed === 'TOKENSEXCEEDED') {
        setError('Your content has exceeded the number of allocated tokens. Please upgrade your plan or revise your prompt.')
      }
      else {
        setError('Server may be in high use or down due to maintenance.');
      }
    }
  };

  return (
    <div className="validate-container">
      <a className="back-link" href="/">← Back to Home</a>
      <div className="validate-card">
        <div className="validate-header">
          <div className="validate-icon">
            <FiClipboard className="validate-icon-bg" />
          </div>
          <h2>Describe Your Startup Idea</h2>
          <p>Share your vision and let Validly provide comprehensive validation insights!</p>
          <div className="validate-controls-row">
            <div className="limit-indicators">
              <span className="word-count-indicator" style={{ color: getWordCountColor() }}>
                {wordCount} / {maxWords} Words
              </span>
              <span className="char-count-indicator" style={{ color: getCharCountColor() }}>
                {charCount} / {maxChars} Chars
              </span>
            </div>
            <div className="controls-right">
              <div className="toggle-group">
                <span className="toggle-label">Personalized Analysis</span>
                <label className="switch">
                  <input type="checkbox" checked={personalized} onChange={() => setPersonalized(v => !v)} />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="model-dropdown-group" ref={dropdownRef}>
                <button
                  type="button"
                  className={`model-dropdown-btn ${selectedModel === 'Quick Search' ? 'quick-search-selected' : ''} ${selectedModel === 'Deep Research' ? 'deep-search-selected' : ''}`}
                  onClick={() => setShowDropdown(v => !v)}
                >
                  {selectedModel}
                  <FiChevronDown style={{ marginLeft: 8, fontSize: '1.1em' }} />
                </button>
                {showDropdown && (
                  <ul className="model-dropdown-list">
                    {availableModels.map((model) => (
                      <li
                        key={model}
                        className={`${model === selectedModel ? 'selected' : ''} ${model === 'Quick Search' ? 'quick-search' : ''} ${model === 'Deep Research' ? 'deep-search' : ''} ${model === 'Deep Research' && !canUseDeepResearch() ? 'premium-locked' : ''}`}
                        onClick={() => handleModelSelection(model)}
                      >
                        {model}
                        {model === 'Deep Research' && !canUseDeepResearch()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          {personalized && (
            <div className="personalized-explanation">
              <small>💡 Personalized analysis considers your personal background to provide more relevant business insights tailored to your specific context. This option is recommended for smaller and local ideas.</small>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="validate-form">
          <textarea
            value={message}
            onChange={handleMessageChange}
            placeholder="e.g., Airbnb for remote workers - a platform that connects digital nomads with co-living spaces designed for productivity. Features include high-speed internet, dedicated workspaces, and community events."
            rows={5}
            required
          />
          <div className="validate-tip">💡 Tip: Be as specific as possible. Include your target audience, key features, and what problem you're solving.</div>
          <button className="validate-btn" type="submit" disabled={loading || wordCount > maxWords || charCount > maxChars}>
            {loading ? 'Validating...' : 'Validate Idea'}
          </button>
          {loading && (
            <div className="loading-bar-container">
              <div className="loading-bar">
                <div 
                  className="loading-bar-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="loading-text">
                {progress < 12.5 && 'Analyzing your startup idea...'}
                {progress >= 12.5 && progress < 25 && 'Researching market demand...'}
                {progress >= 25 && progress < 37.5 && 'Searching for competitors...'}
                {progress >= 37.5 && progress < 50 && 'Finding audience in need...'}
                {progress >= 50 && progress < 62.5 && 'Optimizing revenue model suggestions...'}
                {progress >= 62.5 && progress < 75 && 'Designing the perfect MVP...'}
                {progress >= 75 && progress < 85 && 'Generating comprehensive insights...'}
                {progress >= 85 && 'Finalizing your validation report (may take a minute)...'}
              </div>
            </div>
          )}
          {error && <div className="validate-error">{error}</div>}
        </form>
        
        {/* Upgrade Notification */}
        {showUpgradeNotification && (
          <>
            <div className="upgrade-notification-backdrop"></div>
            <div className="upgrade-notification">
              <div className="upgrade-notification-content">
                <div className="upgrade-notification-icon">🔒</div>
                <div className="upgrade-notification-text">
                  <h4>Upgrade Required</h4>
                  {upgradeType === 'deep-research' ? (
                    <p>Deep Research is available exclusively for Pro Plan users.</p>
                  ) : (
                    <p>Personalized analysis is available exclusively for Pro Plan users.</p>
                  )}
                </div>
                <button 
                  className="upgrade-notification-btn"
                  onClick={() => navigate('/pricing')}
                >
                  Upgrade Now
                </button>
                <button 
                  className="upgrade-notification-close"
                  onClick={() => setShowUpgradeNotification(false)}
                >
                  ×
                </button>
              </div>
            </div>
          </>
        )}
        
        <div className="validate-whatyouget">
          <h3>What you'll get:</h3>
          <ul>
            <li>Market Demand Analysis</li>
            <li>Top Competitor Breakdown</li>
            <li>Target Audience Insights</li>
            <li>Revenue Model Suggestions</li>
            <li>MVP Feature Prioritization</li>
            <li>Downloadable PDF Report</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValidatePage; 