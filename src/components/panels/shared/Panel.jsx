import { useEffect, useRef } from 'react';
import './Panel.css';

/**
 * Base Panel Component
 * Provides expandable/collapsible sidebar functionality
 * Used by both Learn and Challenge panels
 */
export default function Panel({
  side = 'left', // 'left' or 'right'
  isOpen,
  onToggle,
  title,
  icon,
  accentColor,
  children,
  width = 400
}) {
  const panelRef = useRef(null);

  // Trap focus when panel is open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onToggle]);

  const panelStyle = {
    '--panel-width': `${width}px`,
    '--accent-color': accentColor || '#8c7ae6'
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`panel-toggle panel-toggle-${side} ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-label={`${isOpen ? 'Close' : 'Open'} ${title}`}
        aria-expanded={isOpen}
        style={{ [side]: isOpen ? `${width}px` : '0' }}
      >
        <span className="panel-toggle-icon">{icon}</span>
        <span className="panel-toggle-text">{title}</span>
        <span className="panel-toggle-arrow">
          {side === 'left' ? (isOpen ? '◀' : '▶') : (isOpen ? '▶' : '◀')}
        </span>
      </button>

      {/* Panel Overlay (mobile only) */}
      {isOpen && (
        <div
          className="panel-overlay"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Panel Content */}
      <aside
        ref={panelRef}
        className={`panel panel-${side} ${isOpen ? 'open' : ''}`}
        style={panelStyle}
        aria-label={title}
        role="complementary"
      >
        {/* Panel Header */}
        <div className="panel-header">
          <div className="panel-title">
            <span className="panel-icon">{icon}</span>
            <h2>{title}</h2>
          </div>
          <button
            className="panel-close"
            onClick={onToggle}
            aria-label={`Close ${title}`}
          >
            ✕
          </button>
        </div>

        {/* Panel Body */}
        <div className="panel-body">
          {children}
        </div>
      </aside>
    </>
  );
}
