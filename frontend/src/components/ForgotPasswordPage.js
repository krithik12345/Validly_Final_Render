import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the password reset link.');
    }
  };

  return (
    <div className="forgot-password-wrapper">
      <button className="forgot-back-link" onClick={() => window.location.href = '/'}>← Back to Home</button>
      <div className="auth-container">
        <form className="auth-card" onSubmit={handleReset}>
          <h2>Forgot Password</h2>
          <input
            type="email"
            placeholder="Enter Your Account Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Reset Link</button>
          {message && <div className="auth-success">{message}</div>}
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-link-row">
            <span>Remembered your password? </span>
            <a href="/signin">Back to Sign In</a>
          </div>
        </form>
      </div>
    </div>
  );
}
