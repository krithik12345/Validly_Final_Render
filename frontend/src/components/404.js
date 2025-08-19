import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './404.css';

const NotFound = () => {
  const navigate = useNavigate();
  const [redirectTimer, setRedirectTimer] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectTimer((prev) => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="not-found-container">
      <div className="not-found-banner">
        <h1>404 - PAGE NOT FOUND</h1>
        <h3>
          The page you are looking for does not exist.
          <br />
          <br />
          Redirecting you to the{' '}
          <button className="redirect-link" onClick={handleHomeClick}>
            homepage
          </button>{' '}
          in {redirectTimer} seconds...
        </h3>
      </div>
    </div>
  );
};

export default NotFound;
