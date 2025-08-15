import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  getUserPlanLimits,
  hasFeatureAccess,
  canAccessFeature,
  getUpgradeSuggestion,
  canUseDeepResearch,
  canExportPDF,
  canUsePersonalizedAnalysis,
  canUsePriorityProcessing,
  canSaveIdeas,
  canUseSpecificAPIs,
  hasEarlyAccess,
  getIdeaStorageLimit,
} from '../utils/featureAccess';

export const useFeatureAccess = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // initial user fetch
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
      setLoading(false);
    };
    fetchUser();

    // listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // fetch profile whenever user updates
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data || null);
      } else {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [user]);

  const userPlan = profile?.plan || 'free';

  return {
    user,
    profile,
    loading,
    userPlan,

    // plan limits
    planLimits: getUserPlanLimits(userPlan),

    // generic access checks
    hasFeatureAccess: feature => hasFeatureAccess(userPlan, feature),
    canAccessFeature: feature => canAccessFeature(userPlan, feature),
    getUpgradeSuggestion: feature => getUpgradeSuggestion(userPlan, feature),

    // specific feature helpers
    canUseDeepResearch: () => canUseDeepResearch(userPlan),
    canExportPDF: () => canExportPDF(userPlan),
    canUsePersonalizedAnalysis: () => canUsePersonalizedAnalysis(userPlan),
    canUsePriorityProcessing: () => canUsePriorityProcessing(userPlan),
    canSaveIdeas: () => canSaveIdeas(userPlan),
    canUseSpecificAPIs: () => canUseSpecificAPIs(userPlan),
    hasEarlyAccess: () => hasEarlyAccess(userPlan),
    getIdeaStorageLimit: () => getIdeaStorageLimit(userPlan),
  };
};
