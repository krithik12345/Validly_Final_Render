import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './SignInPage.css';

const SignInPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { email, password } = form;
    
    try {
      // 1. Sign in
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // 2. Check if profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code && profileError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw profileError;
      }

      // Passing the metadata to the profiles table
      const { firstName, lastName, country, state, city, educationLevel } = user.user_metadata;
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          country,
          state,
          city,
          education_level: educationLevel
        }]);
      if (upsertError) throw upsertError;

            navigate('/');
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };

  return (
    <div className="signin-wrapper">
      <button className="signin-back-link" onClick={() => navigate('/')}>← Back to Home</button>
      <div className="auth-container">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2 className="auth-title">Sign In</h2>
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button type="submit" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-link-row">
            <span>Don't have an account? </span>
            <Link to="/signup">Sign up</Link>
          </div>
          <div className="auth-link-row">
            <span>Forgot your password? </span>
            <Link to="/forgot-password">Click here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInPage; 