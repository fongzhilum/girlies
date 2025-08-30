import React from 'react';

const ReviewDetails = ({ review }) => {

    const getConfidenceColor = (score) => {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  if (!review) {
    return (
      <div className="review-details">
        <h2 className="section-title">Selected Review</h2>
        <div className="no-selection">Select a review to view details</div>
      </div>
    );
  }

  const getFlagStatus = (flagValue, label, description) => ({
    label,
    description,
    value: flagValue,
    className: flagValue ? 'flag-positive' : 'flag-negative'
  });

  const flags = [
    getFlagStatus(review.Advertisement_Flag, 'Advertisement', 'Contains promotional or advertising content'),
    getFlagStatus(review.Feedback_Flag, 'Feedback', 'Provides constructive feedback about the location'),
    getFlagStatus(review.Irrelevant_Flag, 'Irrelevant', 'Content is not relevant to the location'),
    getFlagStatus(review.Rant_Flag, 'Rant', 'Emotional rant without constructive feedback')
  ];

  const getActiveFlags = () => {
    return flags.filter(flag => flag.value);
  };

  const getEvidence = () => {
    const evidence = review.evidence || [];
    const activeFlags = getActiveFlags();
    
    // Generate evidence based on active flags if not provided
    if (evidence.length === 0 && activeFlags.length > 0) {
      return activeFlags.map(flag => `${flag.label} detected by ML model`);
    }
    
    return evidence;
  };

  return (
    <div className="review-details">
      <h2 className="section-title">Selected Review</h2>
      
      <div className="review-info">
        <div className="review-meta">
          <div className="place-name">{review.place || 'Unknown Place'}</div>
          <div className="user-name">{review.user || 'Anonymous'}</div>
          <div className="timestamp">{review.timestamp || 'N/A'}</div>
        </div>
        
        <div className="review-text">
          {review.fullText}
        </div>
        
        <div className={`score-item confidence ${getConfidenceColor(review.prediction_confidence)}`}>
          <div className="score-label">Prediction Confidence</div>
          <div className="score-value">{`${(review.prediction_confidence * 100).toFixed(1)}%`}</div>
        </div>
          
        <div className="model-flags">
          <h3 className="flags-title">Flags</h3>
          <div className="flags-grid">
            {flags.map((flag, index) => (
              <div key={index} className={`flag-item ${flag.className}`}>
                <div className="flag-indicator">
                  {flag.value ? '✓' : '✗'}
                </div>
                <div className="flag-content">
                  <div className="flag-label">{flag.label}</div>
                  <div className="flag-description">{flag.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        
        {getEvidence().length > 0 && (
          <div className="evidence">
            <h3 className="evidence-title">Supporting Evidence</h3>
            <ul className="evidence-list">
              {getEvidence().map((item, index) => (
                <li key={index} className="evidence-item">{item}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReviewDetails;