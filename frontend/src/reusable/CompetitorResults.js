import React, { useState } from 'react';
import { FiTarget, FiCheckCircle, FiAlertCircle, FiChevronsUp, FiChevronsDown } from 'react-icons/fi';
import '../components/ValidatePage.css';
import '../components/CompetitorResults.css';
import axios from 'axios';

const CompetitorResults = (props) => {
  const { analysis, input, competitors, getScoreColor2, ensureArray} = props;

  const [showMoreMap, setShowMoreMap] = useState({});
  const [patentDataMap, setPatentDataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [hasFetchedMap, setHasFetchedMap] = useState({});

  const userInput = input;

  const toggleShowMore = async (idx, compName) => {
    const alreadyVisible = showMoreMap[idx];

    if (!alreadyVisible && !hasFetchedMap[idx]) {
      try {
        setLoadingMap(prev => ({ ...prev, [idx]: true }));
        const response = await axios.post('http://localhost:5000/patents', { companyName: compName, input: userInput });
        setPatentDataMap(prev => ({ ...prev, [idx]: response.data }));
      } catch (error) {
        console.error("Error fetching patent data:", error);
        setPatentDataMap(prev => ({
          ...prev,
          [idx]: { error: "Unable to load patent data.", patent_ids: [], patent_ip_strength_rating: null, overall_patent_summary: '' }
        }));
      } finally {
        setLoadingMap(prev => ({ ...prev, [idx]: false }));
        setHasFetchedMap(prev => ({ ...prev, [idx]: true }));
      }
    }

    setShowMoreMap(prev => ({ ...prev, [idx]: !alreadyVisible }));
  };

  return (
    <div className="results-section competitors">
      <div className="competitors-header">
        <span className="competitors-icon-bg"><FiTarget className="competitors-icon" /></span>
        <h3>Market Competitiveness</h3>
        <span className={`score-badge ${getScoreColor2(analysis.feasibilityscore)}`}>{analysis.feasibilityscore}/10</span>
      </div>

      {competitors.length > 0 ? competitors.map((comp, idx) => {
        const showMore = !!showMoreMap[idx];
        const loading = loadingMap[idx];
        const patentData = patentDataMap[idx] || {};
        // **DEFAULT PATENT IDS TO AN EMPTY ARRAY**
        const patentIds = patentData.patent_ids ?? [];


        return (
          <div className="competitor-card" key={idx}>
            <div className="competitor-header">
              <span className="competitor-name">{comp.name || 'Unknown'}</span>
              <span className={`popularity-badge ${(comp.popularity || 'Low').toLowerCase()}`}>{comp.popularity || 'Low'} Popularity</span>
            </div>
            <div className="competitor-desc">{comp.description || 'No description available'}</div>
            <div className="competitor-meta">{comp.locations || 'Unknown'} • {comp.pricing || 'Unknown'}</div>

            <div className="button-wrapper">
              <button className="dropdown-button" onClick={() => toggleShowMore(idx, comp.name)}>
                <b>Read {showMore ? 'Less' : 'More'}</b>
                {showMore ? <FiChevronsUp className="chevron-icon" /> : <FiChevronsDown className="chevron-icon" />}
              </button>
            </div>

            <div className={`expandable-wrapper ${showMore ? 'show' : ''}`}>
              <div className="competitor-analysis">
                <div className="analysis-section">
                  <h4>Strengths</h4>
                  <ul className="analysis-list">
                    {ensureArray(comp.pros).map((pro, i) => (
                      <li key={i} className="pro-item">
                        <FiCheckCircle className="pro-icon" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="analysis-section">
                  <h4>Weaknesses</h4>
                  <ul className="analysis-list">
                    {ensureArray(comp.weaknesses).map((weak, i) => (
                      <li key={i} className="weakness-item">
                        <FiAlertCircle className="weakness-icon" />
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="subsection-divider" />

              <div className="patent-information">
                {loading && <p>Loading patent data...</p>}
                {!loading && patentData && (
                  <div className="patent-header">
                    <h4>
                      Intellectual Property Assessment{' '}
                      <span className="uspto-verified">
                        <FiCheckCircle className="verified-icon" /> Sourced by{' '}
                        <a href="https://ppubs.uspto.gov/pubwebapp/static/pages/ppubsbasic.html">
                          USPTO
                        </a>{' '}
                        Data
                      </span>
                    </h4>

                    {patentData.patent_ids?.length === 0 ? (
                      <p>No patents could be found.</p>
                    ) : (
                      <>
                      <div className = "IP-results">
                        <p><b>IP Strength Rating: {patentData.patent_ip_strength_rating}</b></p>
                        <p>{patentData.overall_patent_summary}</p>
                        <div className = "subsection-divider"></div>
                        <p><b>Number of Patents: {patentIds.length}</b></p>
                        <ul className="patent-list">
                          {patentIds.map((id, i) => (
                            <li key={i}>{id}</li>
                          ))}
                        </ul>
                      </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }) : (
        <p>No competitor information available.</p>
      )}
    </div>
  );
};

export default CompetitorResults;
