// Feature access configuration based on subscription plans
export const FEATURE_LIMITS = {
  free: {
    ideaStorage: 100,
    priorityProcessing: false,
    deepResearchEngine: false,
    earlyAccessFeatures: false,
  },
  pro: {
    ideaStorage: 500,
    priorityProcessing: true,
    deepResearchEngine: true,
    earlyAccessFeatures: true,
  },
};

// Helper function to get user's plan limits
export const getUserPlanLimits = (userPlan = 'free') => {
  return FEATURE_LIMITS[userPlan] || FEATURE_LIMITS.free;
};

// Check if user has access to a specific feature
export const hasFeatureAccess = (userPlan = 'free', feature) => {
  const limits = getUserPlanLimits(userPlan);
  return limits[feature] !== undefined ? limits[feature] : false;
};

// Check if user can access a feature (boolean check)
export const canAccessFeature = (userPlan = 'free', feature) => {
  const access = hasFeatureAccess(userPlan, feature);
  return typeof access === 'boolean' ? access : access > 0;
};

// Get upgrade suggestion based on current usage
export const getUpgradeSuggestion = (userPlan = 'free', feature, currentUsage = 0) => {
  if (userPlan === 'pro') return null;
  
  const currentLimit = hasFeatureAccess(userPlan, feature);
  const nextPlan = 'pro';
  const nextLimit = hasFeatureAccess(nextPlan, feature);
  
  if (typeof currentLimit === 'number' && typeof nextLimit === 'number' && currentUsage >= currentLimit * 0.8) {
    return {
      currentPlan: userPlan,
      suggestedPlan: nextPlan,
      currentLimit,
      nextLimit,
      currentUsage,
    };
  }
  
  return null;
};

// Feature-specific helper functions
export const canUseDeepResearch = (userPlan) => canAccessFeature(userPlan, 'deepResearchEngine');
export const canExportPDF = () => true;
export const canUsePersonalizedAnalysis = () => true;
export const canUsePriorityProcessing = (userPlan) => canAccessFeature(userPlan, 'priorityProcessing');
export const canSaveIdeas = (userPlan) => canAccessFeature(userPlan, 'ideaStorage');
export const canUseSpecificAPIs = (userPlan) => canAccessFeature(userPlan, 'specificApiSelections');
export const hasEarlyAccess = (userPlan) => canAccessFeature(userPlan, 'earlyAccessFeatures');

// Usage tracking helpers
export const getIdeaStorageLimit = (userPlan) => hasFeatureAccess(userPlan, 'ideaStorage'); 
