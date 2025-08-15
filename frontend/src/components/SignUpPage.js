import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './SignUpPage.css';

const SignUpPage = () => {
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    country: '',
    state: '',
    city: '',
    educationLevel: '',
    email: '', 
    password: '', 
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const { email, password, confirmPassword, firstName, lastName, country, state, city, educationLevel } = form;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    // Pass metadata to Supabase Auth signUp
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/signin`,
        data: {
          firstName,
          lastName,
          country,
          state,
          city,
          educationLevel
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess('Sign up successful! Please check your email to confirm your account.');
    setLoading(false);
    setTimeout(() => navigate('/signin'), 2500);
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit} autoComplete="off">
        <h2 className="auth-title">Sign Up</h2>
        <input name="firstName" type="text" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
        <input name="lastName" type="text" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
        <div className="form-row">
          <input name="country" type="text" placeholder="Country" value={form.country} onChange={handleChange} required />
          <input name="state" type="text" placeholder="State/Province" value={form.state} onChange={handleChange} />
        </div>
        <input name="city" type="text" placeholder="City" value={form.city} onChange={handleChange} required />
        <select name="educationLevel" value={form.educationLevel} onChange={handleChange} required className="education-select">
          <option value="">Select Education Level</option>
          <option value="High School">High School</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Graduate">Graduate</option>
          <option value="Professional">Professional</option>
        </select>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
        
        <button type="submit" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        
        <div className="auth-link-row">
          <span>Already have an account? </span>
          <Link to="/signin">Sign in</Link>
        </div>
      </form>
    </div>
  );
};

export default SignUpPage; 