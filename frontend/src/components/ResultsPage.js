import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiX, FiCheck, FiDownload, FiTrendingUp, FiTarget, FiUsers, FiCheckCircle, FiDollarSign, FiExternalLink, FiAlertCircle, FiLink, FiMessageSquare, FiCopy, FiClock, FiSave, FiUserCheck, FiChevronsUp, FiChevronsDown } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../supabaseClient';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { getIdeaStorageLimit } from '../utils/featureAccess';
import './ValidatePage.css';
import DemandResults from '../reusable/DemandResults.js';
import CompetitorResults from '../reusable/CompetitorResults.js'
import FounderResults from '../reusable/FounderResults.js';
import AudienceResults from '../reusable/AudienceResults.js';
import RevenueModelResults from '../reusable/RevenueModelResults.js';
import MVPResults from '../reusable/MVPResults.js';
import ResultsOverview from './ResultsOverview.js';


const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis, input } = location.state || {};
  const [user, setUser] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(false);
  const [showStorageLimitModal, setShowStorageLimitModal] = useState(false);
  const [ideaStorageLimit, setIdeaStorageLimit] = useState(0);
  const [profile, setProfile] = useState(null);

    // const { getIdeaStorageLimit, userPlan } = useFeatureAccess();

  // Feature access  // // Debug logging for userPlan
  useEffect(() => {
    console.log('Firing useEffect for userPlan');
     supabase.auth.getUser().then(({ data }) => {
       console.log('data.user from supabase.auth.getUser():', data?.user);
       setUser(data?.user || null);
       setFetching(false);
     });

     const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
       console.log(session?.user);
     });
     return () => { listener?.subscription.unsubscribe(); };

  }, []);

    useEffect(() => {
      const fetchProfile = async () => {
        if (user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(profileData);
        }
      };
      fetchProfile();
    }, [user]);

  useEffect(() => {
  setSaveSuccess(false);
  setSaveError('');
  }, [analysis]);



const handleSaveIdea = async () => {
  console.log('Save idea button clicked');


  // We already have the user from the useEffect
  if (!user) {
    setSaveError('You must be logged in to save an idea.');
    return;
  }

  if (!analysis || !input) {
    setSaveError('No analysis to save. Please validate an idea first.');
    return;
  }
      
  const { count, error: countError } = await supabase
      .from('startup_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);



  const limit = getIdeaStorageLimit(profile.plan);

  if ((count ?? 0) >= limit) {
      setShowStorageLimitModal(true);
      return;
    }

  try {

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    console.log('test');
    const { error: insertError } = await supabase
      .from('startup_ideas')
      .insert({
        user_id: user.id,
        title: analysis.title || 'Untitled Idea',
        question: input,
        analysis
      });

    if (insertError) throw insertError;

    setSaveSuccess(true); 
  } catch (err) {
    console.error(err);
    setSaveError(`Failed to save idea: ${err.message}`);
  } finally {
    setIsSaving(false);
  }
};

  const handleCopyPitch = () => {
    if (analysis?.pitch) {
      navigator.clipboard.writeText(analysis.pitch);
      // You could add a toast notification here to show the copy was successful
    }
  };

  const sortCompetitors = (competitors) => {
    const priorityOrder = {
      'Low': 1,
      'Medium': 2,
      'High': 3 
    };

    competitors.sort((a, b) => {
      return priorityOrder[b.popularity] - priorityOrder[a.popularity];
    });
  }
  
  const generatePDF = async () => {
    const currentDate = new Date().toLocaleDateString();
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    
    // Helper function for PDF generation
    const ensureArrayForPDF = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return [value];
      if (value === null || value === undefined) return [];
      return [];
    };
    
    // Create a temporary div to hold the PDF content
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'fixed';
    pdfContainer.style.left = '0';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '794px'; // A4 at 96dpi
    pdfContainer.style.padding = '40px';
    pdfContainer.style.backgroundColor = '#ffffff';
    pdfContainer.style.fontFamily = 'var(--font-primary)';
    pdfContainer.style.lineHeight = '1.6';
    pdfContainer.style.color = '#333';
    pdfContainer.style.zIndex = '10000';
    
    pdfContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #2563eb;">
        <h1 style="color: #2563eb; font-size: 32px; margin: 0 0 10px 0; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Your Validly Startup Report</h1>
        <div style="color: #666; font-size: 16px;">Generated on ${currentDate}</div>
      </div>

      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin-bottom: 30px; border-radius: 8px;">
        <h2 style="color: #2563eb; margin: 0 0 10px 0; font-size: 20px;">Startup Idea</h2>
        <p style="margin: 0; font-style: italic; color: #555;">"${input}"</p>
      </div>

      <div style="margin-bottom: 40px;">
        <h2 style="color: #2563eb; font-size: 24px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
          Market Demand 
          <span style="display: inline-block; background: #2563eb; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 16px; margin-left: 15px;">${analysis.score || 'N/A'}/10</span>
        </h2>
        <p><strong>Summary:</strong> ${analysis.summary || 'No summary available'}</p>
        <p><strong>Details:</strong> ${analysis.details || 'No details available'}</p>
        
        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">Customer Pain Points</h3>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <strong>Primary Pain Point:</strong> ${painPoints.primaryPainPoint || 'Not specified'}
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <strong>Problem Urgency:</strong> ${painPoints.urgency || 'Not specified'}
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <strong>Evidence of Demand:</strong> ${painPoints.evidence || 'Not specified'}
          </div>
        </div>

        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">Market Timing & Trends</h3>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <strong>Market Readiness:</strong> ${timingTrends.marketReadiness || 'Not specified'}
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <strong>Emerging Trends:</strong> ${timingTrends.emergingTrends || 'Not specified'}
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <strong>Timing Assessment:</strong> ${timingTrends.timingAssessment || 'Not specified'}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 40px;">
        <h2 style="color: #2563eb; font-size: 24px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">Market Competitiveness</h2>
        <span style="display: inline-block; background: #2563eb; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 16px; margin-left: 15px;">${analysis.feasibilityscore || 'N/A'}/10</span>
        ${competitors.length > 0 ? competitors.map(comp => {
          const prosArray = ensureArrayForPDF(comp.pros);
          const weaknessesArray = ensureArrayForPDF(comp.weaknesses);
          return `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: bold; font-size: 18px; color: #2563eb;">${comp.name || 'Unknown'}</span>
              <span style="background: ${(comp.popularity || 'Low').toLowerCase() === 'high' ? '#dc2626' : (comp.popularity || 'Low').toLowerCase() === 'medium' ? '#f59e0b' : '#16a34a'}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 14px; font-weight: bold;">${comp.popularity || 'Low'} Popularity</span>
            </div>
            <p><strong>Description:</strong> ${comp.description || 'No description available'}</p>
            <p><strong>Location:</strong> ${comp.locations || 'Unknown'} • <strong>Pricing:</strong> ${comp.pricing || 'Unknown'}</p>
            
            <div style="display: flex; gap: 20px; margin-top: 15px;">
              <div style="flex: 1;">
                <h4 style="color: #374151; margin: 0 0 10px 0;">Strengths</h4>
                <ul style="list-style: none; padding: 0;">
                  ${prosArray.map(pro => `<li style="padding: 5px 0; border-bottom: 1px solid #f3f4f6;">✓ ${pro}</li>`).join('')}
                </ul>
              </div>
              <div style="flex: 1;">
                <h4 style="color: #374151; margin: 0 0 10px 0;">Weaknesses</h4>
                <ul style="list-style: none; padding: 0;">
                  ${weaknessesArray.map(weakness => `<li style="padding: 5px 0; border-bottom: 1px solid #f3f4f6;">⚠ ${weakness}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        `}).join('') : '<p>No competitor information available.</p>'}
      </div>

      <div style="margin-bottom: 40px;">
        <h2 style="color: #2563eb; font-size: 24px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">Target Audience</h2>
        ${targetAudience.length > 0 ? targetAudience.map(aud => `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0;">
            <div style="font-weight: bold; color: #2563eb; font-size: 18px;">${aud.group || 'Unknown Group'}</div>
            <div style="margin-top: 10px;">
              <strong>Online Destinations:</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${(aud.onlineDestinations || []).map(dest => `
                  <li>${dest.name || 'Unknown'} (${dest.type || 'Other'}) - ${dest.description || 'No description'}</li>
                `).join('')}
              </ul>
            </div>
          </div>
        `).join('') : '<p>No target audience information available.</p>'}

        <div style="background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin: 0 0 15px 0; font-size: 20px;">Professional Pitch</h3>
          <div style="font-style: italic; color: #1e40af; line-height: 1.8;">${analysis.pitch || 'No pitch available'}</div>
        </div>
      </div>

      <div style="margin-bottom: 40px;">
        <h2 style="color: #2563eb; font-size: 24px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">Revenue Model Suggestions</h2>
        <ul style="list-style: none; padding: 0;">
          ${revenueModels.length > 0 ? revenueModels.map(model => `<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${model}</li>`).join('') : '<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">No revenue models suggested</li>'}
        </ul>
      </div>

      <div style="margin-bottom: 40px;">
        <h2 style="color: #2563eb; font-size: 24px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">MVP Feature Set</h2>
        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px;">Suggested MVP Design</h3>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">${analysis.mvpDesign || 'No MVP design available'}</div>
        </div>
        
        <h3 style="color: #374151; margin: 20px 0 10px 0; font-size: 18px;">Feature Prioritization</h3>
        <ul style="list-style: none; padding: 0;">
          ${mvpFeatures.length > 0 ? mvpFeatures.map(feat => `
            <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
              ${feat.feature || 'Unknown feature'}
              <span style="display: inline-block; margin-left: 10px;">
                <span style="background: ${(feat.priority || 'Low').toLowerCase() === 'high' ? '#dc2626' : (feat.priority || 'Low').toLowerCase() === 'medium' ? '#f59e0b' : '#16a34a'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">${feat.priority || 'Low'} Priority</span>
                <span style="background: ${(feat.effort || 'Low').toLowerCase() === 'high' ? '#dc2626' : (feat.effort || 'Low').toLowerCase() === 'medium' ? '#f59e0b' : '#16a34a'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">${feat.effort || 'Low'} Effort</span>
              </span>
            </li>
          `).join('') : '<li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">No MVP features available</li>'}
        </ul>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666; font-size: 14px;">
        <p>Report generated by Validly - Professional Startup Validation Platform</p>
        <p>For more insights and validation tools, visit our platform</p>
      </div>
    `;

    // Add the container to the document
    document.body.appendChild(pdfContainer);

    try {
      // Convert the HTML to canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth - 2 * margin;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with current date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `validly-report-${dateStr}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Clean up
      document.body.removeChild(pdfContainer);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    await generatePDF();
  };

  if (!analysis) {
    return <div className="results-container"><p>No results to display. Please validate an idea first.</p></div>;
  }

  // score badge function 
  const getScoreColor = (inputscore) => {
    if (inputscore >= 7) {
      return 'score-badge-green';
    } else if (inputscore >= 4) {
      return 'score-badge-yellow';
    } else {
      return 'score-badge-red';
    }
  };

  const getScoreColor2 = (inputscore) => {
    if (inputscore <= 3) {
      return 'score-badge-green';
    } else if (inputscore <= 6) {
      return 'score-badge-yellow';
    } else {
      return 'score-badge-red';
    }
  }

  sortCompetitors(analysis.competitors)
  // Add safety checks for required properties
  const marketDemand = analysis.marketDemand || {};
  const painPoints = marketDemand.painPoints || {};
  const timingTrends = marketDemand.timingTrends || {};
  const competitors = analysis.competitors || [];
  const targetAudience = analysis.targetAudience || [];
  const revenueModels = analysis.revenueModels || [];
  const mvpFeatures = analysis.mvpFeatures || [];
  const founderfit = analysis.founderfit || {};
  const positivefounderfit = analysis.positivefounderfit || {};
  const negativefounderfit = analysis.negativefounderfit || {};
  
  // Helper function to ensure array properties are actually arrays
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    if (value === null || value === undefined) return [];
    return [];
  };



  if (analysis.personalizedstatus) {
      return (
    <div className="results-container">
      <button className="back-link" onClick={() => navigate('/validate')}>← Validate Another Idea</button>
      <div className="results-header">
        <div className="results-header-left">
          <h2>Validation Results</h2>
          <div className="results-input">"{input}"</div>
        </div>

        {/* !! COME BACK TO LATER !!  */}
        {/* <div className="results-header-right">
          {saveError && <div className="save-error-message">{saveError}</div>}
        </div> */}
      </div>
      <ResultsOverview analysis={analysis} getScoreColor={getScoreColor} />
      <DemandResults analysis={analysis} painPoints={painPoints} timingTrends={timingTrends} getScoreColor={getScoreColor} />
      <CompetitorResults analysis={analysis} input={input} competitors={competitors} getScoreColor2={getScoreColor2} ensureArray={ensureArray}/>
      <FounderResults analysis={analysis} getScoreColor={getScoreColor} ensureArray={ensureArray}/>
      <AudienceResults analysis={analysis} getScoreColor={getScoreColor} ensureArray={ensureArray} handleCopyPitch={handleCopyPitch} input={input}/>
      <RevenueModelResults analysis={analysis} ensureArray={ensureArray}/>
      <MVPResults analysis={analysis} ensureArray={ensureArray}/>
      
      <div className="results-actions">
        <button className="validate-another-btn" onClick={() => navigate('/validate')}>Validate Another Idea</button>
        <button className={`save-idea-btn ${saveSuccess ? 'saved' : ''}`} onClick={handleSaveIdea} disabled={isSaving || saveSuccess}>
            <FiSave style={{ marginRight: 8 }} />
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Idea'}
        </button>
        <button className="download-btn" onClick={handleDownloadPDF}><FiDownload style={{marginRight: 8, fontSize: '1.2em'}} />Download PDF Report</button>
      </div>
      
      {/* Storage Limit Modal */}
      {showStorageLimitModal && (
        <>
          <div className="upgrade-notification-backdrop"></div>
          <div className="upgrade-notification">
            <div className="upgrade-notification-content">
              <div className="upgrade-notification-icon">📦</div>
              <div className="upgrade-notification-text">
                <h4>Storage Limit Reached</h4>
              </div>
              <button 
                className="upgrade-notification-btn"
                onClick={() => navigate('/pricing')}
              >
                Upgrade Now
              </button>
              <button 
                className="upgrade-notification-close"
                onClick={() => setShowStorageLimitModal(false)}
              >
                ×
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
  }
  return (
    <div className="results-container">
      <button className="back-link" onClick={() => navigate('/validate')}>← Validate Another Idea</button>
      <div className="results-header">
        <div className="results-header-left">
          <h2>Validation Results</h2>
          <div className="results-input">"{input}"</div>
        </div>
        {/* !!! COME BACK TO LATER B/C WE PROBABLY WANT TO HANDLE SAVE ERROR BETTER  */}
        {/* <div className="results-header-right">
          {saveError && <div className="save-error-message">{saveError}</div>}
        </div> */}
      </div>
      <ResultsOverview analysis={analysis} getScoreColor={getScoreColor} />
      <DemandResults analysis={analysis} painPoints={painPoints} timingTrends={timingTrends} getScoreColor={getScoreColor} />
      <CompetitorResults analysis={analysis} input={input} competitors={competitors} getScoreColor2={getScoreColor2} ensureArray={ensureArray}/>
      <AudienceResults analysis={analysis} getScoreColor={getScoreColor} ensureArray={ensureArray} handleCopyPitch={handleCopyPitch} input={input}/>
      <RevenueModelResults analysis={analysis} ensureArray={ensureArray}/>
      <MVPResults analysis={analysis} ensureArray={ensureArray}/>
      
      <div className="results-actions">
        <button className="validate-another-btn" onClick={() => navigate('/validate')}>Validate Another Idea</button>
        <button className={`save-idea-btn ${saveSuccess ? 'saved' : ''}`} onClick={handleSaveIdea} disabled={isSaving || saveSuccess}>
            <FiSave style={{ marginRight: 8 }} />
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Idea'}
        </button>
        <button className="download-btn" onClick={handleDownloadPDF}><FiDownload style={{marginRight: 8, fontSize: '1.2em'}} />Download PDF Report</button>
      </div>
      
      {/* Storage Limit Modal */}
      {showStorageLimitModal && (
        <>
          <div className="upgrade-notification-backdrop"></div>
          <div className="upgrade-notification">
            <div className="upgrade-notification-content">
              <div className="upgrade-notification-icon">📦</div>
              <div className="upgrade-notification-text">
                <h4>Storage Limit Reached</h4>
              </div>
              <button 
                className="upgrade-notification-btn"
                onClick={() => navigate('/pricing')}
              >
                Upgrade Now
              </button>
              <button 
                className="upgrade-notification-close"
                onClick={() => setShowStorageLimitModal(false)}
              >
                ×
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
  

};

export default ResultsPage; 