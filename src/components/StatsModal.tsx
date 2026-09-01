import React from 'react';
import { UserStatsStorage } from '../game/storage';

interface StatsModalProps {
  stats: UserStatsStorage;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">STATISTICS</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="results-grid" style={{ margin: '0 0 1.5rem 0' }}>
          <div className="result-card">
            <span className="result-card-label">BEST WPM</span>
            <span className="result-card-value">{stats.bestWpm}</span>
          </div>
          <div className="result-card">
            <span className="result-card-label">BEST SCORE</span>
            <span className="result-card-value">{stats.bestScore}</span>
          </div>
          <div className="result-card">
            <span className="result-card-label">BEST ACC</span>
            <span className="result-card-value">{stats.bestAccuracy}%</span>
          </div>
          <div className="result-card">
            <span className="result-card-label">GAMES</span>
            <span className="result-card-value">{stats.totalGames}</span>
          </div>
        </div>

        <div style={{ marginBottom: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
          TOTAL WORDS TYPED: <strong style={{ color: 'var(--ink-primary)' }}>{stats.totalWords}</strong>
        </div>

        {stats.history.length > 0 ? (
          <div>
            <h3 style={{ fontFamily: 'var(--font-typewriter)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Recent Sessions
            </h3>
            <table className="history-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>WPM</th>
                  <th>ACCURACY</th>
                  <th>WORDS</th>
                </tr>
              </thead>
              <tbody>
                {stats.history.slice(0, 8).map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><strong>{h.wpm}</strong></td>
                    <td>{h.accuracy}%</td>
                    <td>{h.words}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)', marginTop: '1rem' }}>
            No games recorded yet. Start your first sprint!
          </p>
        )}
      </div>
    </div>
  );
};
