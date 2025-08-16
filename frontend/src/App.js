import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';

import HomePage from './components/HomePage';
import ValidatePage from './components/ValidatePage';
import ResultsPage from './components/ResultsPage';
import SignUpPage from './components/SignUpPage';
import SignInPage from './components/SignInPage';
import PricingPage from './components/PricingPage';
import ProfileDashboard from './components/ProfileDashboard';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import UnderConstructionPage from './components/UnderConstruction';
import NotFoundPage from './components/404';
import FeaturesPage from './components/Features';
import IdeaComparisonPage from './components/IdeaComparisonPage';
import './App.css';
import PrivacyPolicy from './components/PrivacyPolicy';
import TOS from './components/TOS';

function App() {

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      console.log('Current session:', session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/validate" element={<ValidatePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile" element={<ProfileDashboard />} />
        <Route path="/compare" element={<IdeaComparisonPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/under-construction" element={<UnderConstructionPage/>} />
        <Route path="*" element={<NotFoundPage/>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/tos" element={<TOS />} />
      </Routes>
    </Router>
  );
}

export default App;
