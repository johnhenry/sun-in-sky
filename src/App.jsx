import { Suspense } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import './App.css';

export default function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app-container">
      {/* Navigation Header (only show when not on homepage) */}
      {!isHomePage && (
        <nav className="app-nav">
          <Link to="/" className="nav-home-button">
            ← Back to Apps
          </Link>
        </nav>
      )}

      {/* Main Content with Lazy Loading */}
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Loading application...</p>
    </div>
  );
}
