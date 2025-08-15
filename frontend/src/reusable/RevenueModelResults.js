import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiX, FiCheck, FiDownload, FiTrendingUp, FiTarget, FiUsers, FiCheckCircle, FiDollarSign, FiExternalLink, FiAlertCircle, FiLink, FiMessageSquare, FiCopy, FiClock, FiSave, FiUserCheck, FiChevronsUp, FiChevronsDown } from 'react-icons/fi';
import '../components/ValidatePage.css';


const RevenueModelResults  = (props) => {
    const analysis = props.analysis;
    const ensureArray = props.ensureArray;

    return (  
    <div className="results-section revenue-models">
        <div className="revenue-models-header">
          <span className="revenue-models-icon-bg"><FiDollarSign className="revenue-models-icon" /></span>
          <h3>Revenue Model Suggestions</h3>
        </div>
        <ul className="revenue-models-list">
          {analysis.revenueModels.length > 0 ? (
            analysis.revenueModels.map((model, idx) => (
              <li className="revenue-models-item" key={idx}>
                <FiCheckCircle className="revenue-models-check" />
                <span>{model}</span>
              </li>
            ))
          ) : (
            <li className="revenue-models-item">No revenue models suggested</li>
          )}
        </ul>
      </div>
    );
}
 
export default RevenueModelResults;