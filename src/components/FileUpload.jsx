import React, { useState } from 'react';

const FileUpload = ({ onAnalyze }) => {
  const [reviewText, setReviewText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleAnalyze = () => {
    if (reviewText.trim() || selectedFile) {
      onAnalyze({ text: reviewText, file: selectedFile });
    }
  };

  return (
    <div className="upload-section">
      <h2 className="section-title">Upload Excel/CSV</h2>
      
      <div className="file-upload-area">
        <input
          type="file"
          id="file-input"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="file-input"
        />
        <label htmlFor="file-input" className="file-upload-label">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="file-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="file-upload-text">
            <div className="file-upload-title">Choose file</div>
            <div className="file-upload-subtitle">(.xlsx .xls .csv files)</div>
          </div>
        </label>
        {selectedFile && (
          <div className="selected-file">{selectedFile.name}</div>
        )}
      </div>

      <h3 className="paste-title">Paste a single review</h3>
      
      <textarea
        className="review-textarea"
        placeholder="Paste your review text here..."
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        rows={4}
      />

      <button className="analyze-button" onClick={handleAnalyze}>
        Analyse text
      </button>
    </div>
  );
};

export default FileUpload;
