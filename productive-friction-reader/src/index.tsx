import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const params = new URLSearchParams(window.location.search);
const paperId = params.get('paper') || 'mack_et_al_chi2021';
const condition = (params.get('condition') || 'baseline') as 'baseline' | 'frictionless' | 'friction';
const participantId = params.get('pid') || 'unknown';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App paperId={paperId} condition={condition} participantId={participantId} />
  </React.StrictMode>
);
