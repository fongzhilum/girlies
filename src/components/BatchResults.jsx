import React from 'react';

const BatchResults = ({ results, onSelectReview, selectedReviewId, loading }) => {
  const getConfidenceColor = (score) => {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  const getFlagBadges = (review) => {
    const badges = [];
    
    if (review.Advertisement_Flag) {
      badges.push({ label: 'Advertisement', color: 'purple' });
    }
    if (review.Feedback_Flag) {
      badges.push({ label: 'Feedback', color: 'green' });
    }
    if (review.Irrelevant_Flag) {
      badges.push({ label: 'Irrelevant', color: 'orange' });
    }
    if (review.Rant_Flag) {
      badges.push({ label: 'Rant', color: 'red' });
    }
    
    return badges;
  };

  const summaryStats = {
    total: results.length,
    advertisement: results.filter(r => r.Advertisement_Flag).length,
    feedback: results.filter(r => r.Feedback_Flag).length,
    irrelevant: results.filter(r => r.Irrelevant_Flag).length,
    rant: results.filter(r => r.Rant_Flag).length
  };

  if (loading) {
    return (
      <div className="batch-results">
        <h2 className="section-title">Results</h2>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Analysing reviews...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="batch-results">
        <h2 className="section-title">Results</h2>
        <div className="empty-state">
          <p>No results to display. Upload a file or enter text to analyse reviews.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-results">
      <h2 className="section-title">Results ({results.length})</h2>
      
      <div className="results-container">
        <div className="results-table">
          <div className="table-header">
            <div className="header-cell">Place</div>
            <div className="header-cell">User</div>
            <div className="header-cell">Review</div>
            <div className="header-cell">Confidence</div>
            <div className="header-cell">Flags</div>
            <div className="header-cell">Timestamp</div>
          </div>
          
          <div className="table-body-container">
            <div className="table-body">
              {results.map((review) => (
                <div
                  key={review.id}
                  className={`table-row ${selectedReviewId === review.id ? 'selected' : ''}`}
                  onClick={() => onSelectReview(review)}
                >
                  <div className="cell">{review.place || 'Unknown Place'}</div>
                  <div className="cell">{review.user || 'Anonymous'}</div>
                  <div className="cell review-snippet">{review.snippet}</div>
                  <div className="cell">
                    <span className={`confidence-score ${getConfidenceColor(review.prediction_confidence)}`}>
                      {(review.prediction_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="cell flags-cell">
                    {getFlagBadges(review).map((badge, index) => (
                      <span key={index} className={`flag-badge ${badge.color}`}>
                        {badge.label}
                      </span>
                    ))}
                    {getFlagBadges(review).length === 0 && (
                      <span className="flag-badge gray">No Flags</span>
                    )}
                  </div>
                  <div className="cell">{review.timestamp || 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{summaryStats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Advertisement</span>
          <span className="stat-value red">{summaryStats.advertisement}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Feedback</span>
          <span className="stat-value green">{summaryStats.feedback}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Irrelevant</span>
          <span className="stat-value orange">{summaryStats.irrelevant}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rant</span>
          <span className="stat-value purple">{summaryStats.rant}</span>
        </div>
      </div>
    </div>
  );
};

export default BatchResults;