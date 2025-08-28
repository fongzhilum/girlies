import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import BatchResults from './components/BatchResults';
import ReviewDetails from './components/ReviewDetails';
import './App.css';

const App = () => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [results, setResults] = useState([]);

const handleAnalyze = async ({ text, file }) => {
  if (file) {
    const form = new FormData();
    form.append("file", file);          // CSV or XLSX
    // Optional: form.append("text_column", "review");
    const resp = await fetch("http://localhost:8000/api/analyze_file", {
      method: "POST",
      body: form,
    });
    const data = await resp.json();
    setResults(data.results);
    setSelectedReview(null);
  } else if (text?.trim()) {
    const resp = await fetch("http://localhost:8000/api/analyze_text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),   // optionally add place/user/timestamp
    });
    const data = await resp.json();
    setResults(data.results);
    setSelectedReview(data.results[0]);
  }
};

  const handleSelectReview = (review) => {
    setSelectedReview(review);
  };

  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <FileUpload onAnalyze={handleAnalyze} />
        </div>
        <div className="center-panel">
          <BatchResults 
            results={results}
            onSelectReview={handleSelectReview}
            selectedReviewId={selectedReview?.id}
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
