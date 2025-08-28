import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <h1 className="header-title">Review Quality & Relevancy Checker</h1>
      <button className="menu-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="currentColor"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
          <circle cx="12" cy="19" r="2" fill="currentColor"/>
        </svg>
      </button>
    </header>
  );
};

export default Header;
