import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import BatchResults from './components/BatchResults';
import ReviewDetails from './components/ReviewDetails';
import './App.css';

const App = () => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Transform backend response to match new four-flag interface
  const transformResults = (backendResults) => {
    return backendResults.map(result => ({
      ...result,
      prediction_confidence: result.qualityScore || result.prediction_confidence || 0,
      // Map to the four new flags
      Advertisement_Flag: result.Advertisement_Flag || result.flags?.includes('Advertisement') || false,
      Feedback_Flag: result.Clean_Review_Flag || result.flags?.includes('Clean Review') || result.flags?.length === 0 || false,
      Irrelevant_Flag: result.Irrelevant_Content_Flag || result.flags?.includes('Irrelevant') || false,
      Rant_Flag: result.Review_without_Visit_Flag || result.flags?.includes('Rant (no visit)') || result.flags?.includes('Rant') || false,
      // Keep original fields for compatibility
      originalFlags: result.flags || []
    }));
  };

  const handleAnalyze = async ({ text, file }) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (file) {
        // Handle file upload
        const formData = new FormData();
        formData.append("file", file);
        
        response = await fetch("http://localhost:8000/api/analyze_file", {
          method: "POST",
          body: formData,
        });
      } else if (text?.trim()) {
        // Handle single text input
        response = await fetch("http://localhost:8000/api/analyze_text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
      } else {
        throw new Error("Please provide either text input or upload a file");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format from server");
      }

      const transformedResults = transformResults(data.results);
      setResults(transformedResults);
      
      // Auto-select first result for single text input
      if (text?.trim() && transformedResults.length > 0) {
        setSelectedReview(transformedResults[0]);
      } else {
        setSelectedReview(null);
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis');
      setResults([]);
      setSelectedReview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReview = (review) => {
    setSelectedReview(review);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <FileUpload 
            onAnalyze={handleAnalyze} 
            loading={loading}
            error={error}
            onClearError={clearError}
          />
        </div>
        <div className="center-panel">
          <BatchResults 
            results={results}
            onSelectReview={handleSelectReview}
            selectedReviewId={selectedReview?.id}
            loading={loading}
          />
        </div>
        <div className="right-panel">
          <ReviewDetails review={selectedReview} />
        </div>
      </div>
    </div>
  );
};

export default App;