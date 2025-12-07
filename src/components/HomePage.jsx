import { Link } from 'react-router-dom';
import { APPS } from '../config/apps';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="homepage">
      <header className="homepage-header">
        <h1>📚 Educational Apps</h1>
        <p className="homepage-subtitle">
          Interactive visualizations for learning astronomy and physics
        </p>
      </header>

      <main className="app-grid">
        {APPS.map((app) => (
          <Link
            key={app.id}
            to={app.path}
            className="app-card"
            aria-label={`Open ${app.name}`}
          >
            <div className="app-icon">{app.icon}</div>
            <h2 className="app-name">{app.name}</h2>
            <p className="app-description">{app.description}</p>
            <button className="app-launch-button">
              Launch App →
            </button>
          </Link>
        ))}
      </main>

      <footer className="homepage-footer">
        <p>
          Built with React, Three.js, and Vite •{' '}
          <a
            href="https://github.com/yourusername/educational-apps"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
