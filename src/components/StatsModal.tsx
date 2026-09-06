import React from 'react';
import { UserStatsStorage } from '../game/storage';
import { loadDailyChallengeState } from '../game/dailyChallenge';

interface StatsModalProps {
  stats: UserStatsStorage;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  const dailyState = loadDailyChallengeState();

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-title"
      >
        <div className="modal-header">
          <h2 id="stats-title" className="modal-title">STATISTICS</h2>
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
            <span className="result-card-label">60S SPRINT</span>
            <span className="result-card-value">{stats.modeBests?.sprint || stats.bestWpm}</span>
          </div>
          <div className="result-card">
            <span className="result-card-label">30S BLITZ</span>
            <span className="result-card-value">{stats.modeBests?.blitz || 0}</span>
          </div>
          <div className="result-card">
            <span className="result-card-label">STREAK MODE</span>
            <span className="result-card-value">{stats.modeBests?.streak || 0}</span>
          </div>
          <div className="result-card">
            <span className="result-card-label">DAILY STREAK</span>
            <span className="result-card-value">{dailyState.streak} {dailyState.streak === 1 ? 'DAY' : 'DAYS'}</span>
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
                  <th>MODE</th>
                  <th>WPM</th>
                  <th>ACC</th>
                </tr>
              </thead>
              <tbody>
                {stats.history.slice(0, 8).map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{h.mode || 'sprint'}</td>
                    <td><strong>{h.wpm}</strong></td>
                    <td>{h.accuracy}%</td>
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
