import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import HomePage from './components/HomePage.jsx';
import { APPS } from './config/apps.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          {APPS.map((app) => (
            <Route
              key={app.id}
              path={app.path}
              element={<app.component />}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
