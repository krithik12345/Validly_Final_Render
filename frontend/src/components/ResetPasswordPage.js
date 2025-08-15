import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully. You can now log in.');
      setTimeout(() => navigate('/signin'), 2000);
    }
  };

  return (
    <div className="reset-password-wrapper">
      <button className="reset-back-link" onClick={() => navigate('/')}>← Back to Home</button>
      <div className="auth-container">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Reset Password</h2>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button type="submit">Update Password</button>
          {message && <div className="auth-success">{message}</div>}
          {error && <div className="auth-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
