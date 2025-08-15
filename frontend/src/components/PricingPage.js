import React, { useState, useEffect } from 'react';
import './PricingPage.css';
import { supabase } from '../supabaseClient';
import { FiUser, FiZap, FiCalendar, FiStar, FiCircle } from 'react-icons/fi';

const infoPoints = [
  {
    icon: <span className="info-emoji">🔒</span>, text: 'Secured Payments via Stripe • Cancel Subscription Anytime'
  },
  {
    icon: <span className="info-emoji">💳</span>, text: 'All Major Cards Accepted'
  },
  {
    icon: <span className="info-emoji">🌐</span>, text: 'Available Worldwide'
  },
  {
    icon: <span className="info-emoji">📧</span>, text: 'Email Support Included'
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const planData = (billing, userEmail = '') => ([
    {
      name: 'Free',
      price: '$0',
      period: '',
      features: [
        'Basic Idea Analysis',
        'Quick Search',
        'Competitor Overview',
        'Idea/Product Storage (100)',
        'Personalized Search',
        'Downloadable PDF Exports',
        { text: 'Priority AI Processing', unavailable: true },
        { text: 'Deep Research', unavailable: true },
      ],
      button: 'Start for Free',
      highlight: false,
      icon: <span className="plan-icon-bg free large"><FiUser className="plan-icon-svg large" /></span>,
      paymentLink: null,
    },
    {
      name: 'Pro',
      price: billing === 'monthly' ? '$9.99' : '$89.99',
      period: billing === 'monthly' ? '/month' : '/year',
      features: [
        'Everything in Free Plan',
        'Deep Research',
        'Idea/Product Storage (500)',
        'Priority AI Processing',
        'Early Access to New Features',
      ],
      button: 'Upgrade to Pro',
      highlight: true,
      badge: 'Limited-Time Price',
      icon: <span className="plan-icon-bg pro large"><FiZap className="plan-icon-svg large" /></span>,
      productId: 'prod_SYknpEzXHNaC6J',
      paymentLink: billing === 'monthly' 
        ? `http://localhost:5000/subscribe?plan=pro_monthly${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}${userId ? `&user_id=${userId}` : ''}`
        : `http://localhost:5000/subscribe?plan=pro_yearly${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}${userId ? `&user_id=${userId}` : ''}`,
    },

  ]);

  const plans = planData(billing, userEmail);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
  
    getUserData();
  }, []);

  // Debug log to see current userEmail state
  console.log('Current userEmail state:', userEmail);

  const handlePlanClick = (plan) => {
    if (plan.name === 'Free') {
      // Handle free plan - could redirect to sign up or dashboard
      window.location.href = '/validate';
      return;
    }
    
    if (plan.paymentLink) {
      // Redirect to Stripe checkout
      window.open(plan.paymentLink, '_blank');
    }
  };

  return (
    <div className="pricing-bg">
      <div className="pricing-container">
        <a href="/" className="pricing-back">&larr; Back to Home</a>
        <h1 className="pricing-title">
          Choose Your <span className="pricing-gradient">Validation Journey</span>
        </h1>
        <p className="pricing-subtitle">
          Start free and upgrade as you validate more ideas. All plans include<br />
          our core AI validation engine.
        </p>
        {/* Billing Toggle */}
        <div className="pricing-toggle-wrap" style={{ marginBottom: 40 }}>
          <div className="pricing-toggle">
            <button
              className={billing === 'monthly' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button
              className={billing === 'yearly' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setBilling('yearly')}
            >
              Yearly <span className="toggle-save">Save 25%</span>
            </button>
          </div>
        </div>
        {/* Pricing Cards */}
        <div className="pricing-cards" style={{ marginTop: 32 }}>
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={
                'pricing-card' +
                (plan.highlight ? ' popular' : '')
              }
            >
              {plan.badge && (
                <span className="pricing-badge">
                  <FiStar className="badge-star" /> {plan.badge}
                </span>
              )}
              <span className="pricing-icon">{plan.icon}</span>
              <h2 className="pricing-plan-name">{plan.name}</h2>
              <div className="pricing-plan-desc">
                {plan.name === 'Free' && 'Perfect for drafting your first startup idea'}
                {plan.name === 'Pro' && 'Deeper insights for serious entrepreneurs'}
              </div>
              <div className="pricing-price-row">
                <span className="pricing-price">{plan.price}</span>
                {plan.period && <span className="pricing-period">{plan.period}</span>}
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature, i) =>
                  typeof feature === 'string' ? (
                    <li key={i} className="feature-available">
                      <span className="feature-check">✔</span>
                      {feature}
                    </li>
                  ) : (
                    <li key={i} className="feature-unavailable">
                      <span className="feature-unavailable-icon"><FiCircle /></span>
                      {feature.text}
                    </li>
                  )
                )}
              </ul>
              <button
                className={
                  plan.highlight
                    ? 'pricing-btn gradient-btn'
                    : 'pricing-btn'
                }
                onClick={() => handlePlanClick(plan)}
              >
                {plan.button}
              </button>
            </div>
          ))}
        </div>
        {/* Info Points */}
        <div className="pricing-info-points">
          <div className="info-row info-row-top">
            <span className="info-point">{infoPoints[0].icon} {infoPoints[0].text}</span>
          </div>
          <div className="info-row info-row-bottom">
            {infoPoints.slice(1).map((point, idx) => (
              <span className="info-point" key={idx}>
                {point.icon} {point.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
