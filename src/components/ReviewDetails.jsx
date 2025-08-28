import React from 'react';

const ReviewDetails = ({ review }) => {
  if (!review) {
    return (
      <div className="review-details">
        <h2 className="section-title">Selected Review</h2>
        <div className="no-selection">Select a review to view details</div>
      </div>
    );
  }

  return (
    <div className="review-details">
      <h2 className="section-title">Selected Review</h2>
      
      <div className="review-info">
        <div className="review-meta">
          <div className="place-name">{review.place}</div>
          <div className="user-name">{review.user}</div>
          <div className="timestamp">{review.timestamp}</div>
        </div>
        
        <div className="review-text">
          {review.fullText}
        </div>
        
        <div className="scores">
          <div className="score-item quality">
            <div className="score-label">Quality</div>
            <div className="score-value">{review.qualityScore.toFixed(2)}</div>
          </div>
          <div className="score-item relevancy">
            <div className="score-label">Relevancy</div>
            <div className="score-value">{review.relevancy.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="policy-flags">
          <h3 className="flags-title">Policy Flags</h3>
          <div className="flags-list">
            {review.flags.map((flag, index) => (
              <span key={index} className="policy-flag">
                {flag}
              </span>
            ))}
            {review.flags.length === 0 && (
              <span className="no-flags">No policy violations detected</span>
            )}
          </div>
        </div>
        
        <div className="evidence">
          <h3 className="evidence-title">Evidence</h3>
          <ul className="evidence-list">
            {review.evidence.map((item, index) => (
              <li key={index} className="evidence-item">{item}</li>
            ))}
            {review.evidence.length === 0 && (
              <li className="evidence-item">No evidence available</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetails;
