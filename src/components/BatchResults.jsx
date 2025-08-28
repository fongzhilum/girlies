import React from 'react';

const BatchResults = ({ results, onSelectReview, selectedReviewId }) => {
  const getRelevancyColor = (score) => {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  const getFlagColor = (flag) => {
    const colors = {
      'Advertisement': 'red',
      'Irrelevant': 'orange',
      'Rant': 'purple',
      'Rant (no visit)': 'purple'
    };
    return colors[flag] || 'gray';
  };

  const summaryStats = {
    ads: results.filter(r => r.flags.includes('Advertisement')).length,
    irrelevant: results.filter(r => r.flags.includes('Irrelevant')).length,
    rant: results.filter(r => r.flags.includes('Rant') || r.flags.includes('Rant (no visit)')).length,
    clean: results.filter(r => r.flags.length === 0).length
  };

  return (
    <div className="batch-results">
      <h2 className="section-title">Results</h2>
      
      <div className="results-table">
        <div className="table-header">
          <div className="header-cell">Place</div>
          <div className="header-cell">User</div>
          <div className="header-cell">Review</div>
          <div className="header-cell">Relevancy</div>
          <div className="header-cell">Flags</div>
          <div className="header-cell">Timestamp</div>
        </div>
        
        <div className="table-body">
          {results.map((review) => (
            <div
              key={review.id}
              className={`table-row ${selectedReviewId === review.id ? 'selected' : ''}`}
              onClick={() => onSelectReview(review)}
            >
              <div className="cell">{review.place}</div>
              <div className="cell">{review.user}</div>
              <div className="cell review-snippet">{review.snippet}</div>
              <div className="cell">
                <span className={`relevancy-score ${getRelevancyColor(review.relevancy)}`}>
                  {review.relevancy.toFixed(2)}
                </span>
              </div>
              <div className="cell flags-cell">
                {review.flags.map((flag, index) => (
                  <span key={index} className={`flag-badge ${getFlagColor(flag)}`}>
                    {flag}
                  </span>
                ))}
              </div>
              <div className="cell">{review.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat-item">
          <span className="stat-label">Ads</span>
          <span className="stat-value">{summaryStats.ads}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Irrelevant</span>
          <span className="stat-value">{summaryStats.irrelevant}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rant (no visit)</span>
          <span className="stat-value">{summaryStats.rant}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Clean</span>
          <span className="stat-value">{summaryStats.clean}</span>
        </div>
      </div>
    </div>
  );
};

export default BatchResults;
