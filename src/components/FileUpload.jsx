import React, { useState } from 'react';

const FileUpload = ({ onAnalyze, loading, error, onClearError }) => {
  const [reviewText, setReviewText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileSelection(file);
  };

  const handleFileSelection = (file) => {
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
        onClearError();
        alert('Please select a valid Excel (.xlsx, .xls) or CSV file');
        return;
      }
      
      setSelectedFile(file);
      setReviewText(''); // Clear text input when file is selected
      onClearError();
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!reviewText.trim() && !selectedFile) {
      alert('Please provide either text input or upload a file');
      return;
    }
    
    onAnalyze({ text: reviewText, file: selectedFile });
  };

  const handleTextChange = (e) => {
    setReviewText(e.target.value);
    if (selectedFile) {
      setSelectedFile(null); // Clear file when text is entered
    }
    onClearError();
  };

  const clearInputs = () => {
    setReviewText('');
    setSelectedFile(null);
    onClearError();
  };

  return (
    <div className="upload-section">
      <h2 className="section-title">Upload Excel/CSV</h2>
      
      {error && (
        <div className="error-message">
          <span className="error-text">{error}</span>
          <button className="error-close" onClick={onClearError}>×</button>
        </div>
      )}
      
      <div 
        className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="file-input"
          disabled={loading}
        />
        <label htmlFor="file-input" className="file-upload-label">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="file-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="file-upload-text">
            <div className="file-upload-title">
              {dragActive ? 'Drop file here' : 'Choose file or drag & drop'}
            </div>
            <div className="file-upload-subtitle">(.xlsx .xls .csv files)</div>
          </div>
        </label>
        {selectedFile && (
          <div className="selected-file">
            <span>{selectedFile.name}</span>
            <button className="remove-file" onClick={() => setSelectedFile(null)}>×</button>
          </div>
        )}
      </div>

      <h3 className="paste-title">Or paste a single review</h3>
      
      <textarea
        className="review-textarea"
        placeholder="Paste your review text here..."
        value={reviewText}
        onChange={handleTextChange}
        rows={4}
        disabled={loading}
      />

      <div className="button-group">
        <button 
          className="analyze-button" 
          onClick={handleAnalyze}
          disabled={loading || (!reviewText.trim() && !selectedFile)}
        >
          {loading ? 'Analysing...' : 'Analyse text'}
        </button>
        
        {(reviewText.trim() || selectedFile) && (
          <button className="clear-button" onClick={clearInputs} disabled={loading}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;