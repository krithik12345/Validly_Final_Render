import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import './FeatureGuard.css';

const FeatureGuard = ({ 
  feature, 
  children, 
  fallback = null, 
  showUpgradePrompt = true,
  className = '',
  ...props 
}) => {
  const { canAccessFeature, getUpgradeSuggestion} = useFeatureAccess();
  const navigate = useNavigate();
  
  const hasAccess = canAccessFeature(feature);
  const upgradeSuggestion = getUpgradeSuggestion(feature);
  
  if (hasAccess) {
    return <div className={className} {...props}>{children}</div>;
  }
  
  if (fallback) {
    return <div className={className} {...props}>{fallback}</div>;
  }
  
  if (!showUpgradePrompt) {
    return null;
  }
  
  return (
    <div className={`feature-guard ${className}`} {...props}>
      <div className="feature-guard-content">
        <div className="feature-guard-icon">🔒</div>
        <h3>Upgrade Required</h3>
        <p>This feature is available for {upgradeSuggestion?.suggestedPlan || 'Pro'} users and above.</p>
        <button 
          className="feature-guard-upgrade-btn"
          onClick={() => navigate('/pricing')}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
};

// Specialized components for common features
export const DeepResearchGuard = ({ children, ...props }) => (
  <FeatureGuard feature="deepResearchEngine" {...props}>
    {children}
  </FeatureGuard>
);

export const PDFExportGuard = ({ children, ...props }) => (
  <FeatureGuard feature="pdfExports" {...props}>
    {children}
  </FeatureGuard>
);

export const PersonalizedAnalysisGuard = ({ children, ...props }) => (
  <FeatureGuard feature="personalizedAnalysis" {...props}>
    {children}
  </FeatureGuard>
);

export const PriorityProcessingGuard = ({ children, ...props }) => (
  <FeatureGuard feature="priorityProcessing" {...props}>
    {children}
  </FeatureGuard>
);

export const IdeaStorageGuard = ({ children, ...props }) => (
  <FeatureGuard feature="ideaStorage" {...props}>
    {children}
  </FeatureGuard>
);

export const SpecificAPIsGuard = ({ children, ...props }) => (
  <FeatureGuard feature="specificApiSelections" {...props}>
    {children}
  </FeatureGuard>
);

export const EarlyAccessGuard = ({ children, ...props }) => (
  <FeatureGuard feature="earlyAccessFeatures" {...props}>
    {children}
  </FeatureGuard>
);

export default FeatureGuard; 