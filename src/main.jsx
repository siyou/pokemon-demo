import React from 'react';
import ReactDOM from 'react-dom/client';
import List from './list';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <h1>Pokemon</h1>
    <List />
  </React.StrictMode>
);
