import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UnderConstruction.css';
import { Link } from 'react-router-dom';

  const messages = [
  'Validly\'s greatest minds are assembling to build this.',
  'We\'re building something amazing, but it\'s not quite ready yet.',
  'Even the best startups take time to build. We promise it\'ll be worth the wait.',
  'Our developers are typing away furiously to bring you this feature.',
  'This page is under construction. Please check back later.'
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

const UnderConstruction = () => {

  

  const navigate = useNavigate();
  const [redirectTimer, setRedirectTimer] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectTimer(redirectTimer - 1);
      if (redirectTimer === 0) {
        navigate('/');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [redirectTimer, navigate]);


  return (
    <div className="uc-container">
      <div className="uc-banner">
        <h1>UNDER CONSTRUCTION</h1>
        <h3>{message}</h3>
        <h3>Redirecting you to the <Link className="redirect" onClick={() => navigate('/')}>homepage</Link> in {redirectTimer} seconds...</h3>
        <br></br>
      </div>
    </div>
  );
};

export default UnderConstruction;