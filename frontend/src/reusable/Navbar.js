import React from 'react';
import { useEffect, useState } from 'react';
import { FiUser } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Stay on homepage after sign out
    // No navigation needed
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/validly-logo-192x192.png" alt="Validly Logo" className="navbar-logo" />
        <span className="navbar-title">Validly</span>
      </div>
      <div className="navbar-right">
        {user && (
          <button
            className="navbar-profile-btn"
            title="Profile"
            onClick={() => navigate('/profile')}
          >
            <FiUser className="navbar-profile-icon" />
          </button>
        )}
        {user ? (
          <button className="navbar-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : (
          <button className="navbar-signout" onClick={() => navigate('/signin')}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
