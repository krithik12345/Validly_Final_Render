import React from 'react';
import { useNavigate } from 'react-router-dom';
import './404.css';


const NotFound = () => {
  const navigate = useNavigate();
  const [redirectTimer, setRedirectTimer] = React.useState(5);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRedirectTimer(redirectTimer - 1);
      if (redirectTimer === 0) {
        navigate('/');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [redirectTimer, navigate]);

  return (
    <div className="not-found-banner">
      <h1>404 - PAGE NOT FOUND</h1>
      <h3>
        The page you are looking for does not exist.
        <br></br>
        <br></br>
        Redirecting you to the <button className="redirect" onClick={() => navigate('/')}>homepage</button> in {redirectTimer} seconds...
      </h3>
    </div>
  );
};

export default NotFound;
