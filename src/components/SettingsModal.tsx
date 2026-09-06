import React, { useState } from 'react';
import { sound, SoundProfile } from '../game/sound';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.getUserSetting());
  const [soundProfile, setSoundProfile] = useState<SoundProfile>(sound.getProfile());
  const [soundVolume, setSoundVolume] = useState<number>(sound.getVolume());
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
    if (next) {
      sound.playKeyClick();
    }
  };

  const handleProfileChange = (profile: SoundProfile) => {
    setSoundProfile(profile);
    sound.setProfile(profile);
    sound.playKeyClick();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSoundVolume(val);
    sound.setVolume(val);
  };


  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="modal-header">
          <h2 id="settings-title" className="modal-title">SETTINGS</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Audio Toggle */}
        <div className="setting-row">
          <div>
            <div className="setting-label">AUDIO FEEDBACK</div>
            <div className="setting-desc">Tactile keypress sounds, bell & buzzer</div>
          </div>
          <label className="retro-switch" aria-label="Toggle sound effects">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={handleSoundToggle}
            />
            <div className="retro-switch-box">
              <div className="retro-switch-nob" />
            </div>
          </label>
        </div>

        {/* Sound Profile Selector */}
        {soundEnabled && (
          <>
            <div className="setting-row">
              <div>
                <div className="setting-label">KEYBOARD SOUND PROFILE</div>
                <div className="setting-desc">Vintage ribbon hammer or clicky switch</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleProfileChange('typewriter')}
                  className={`btn-secondary ${soundProfile === 'typewriter' ? 'btn-active' : ''}`}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    backgroundColor: soundProfile === 'typewriter' ? 'var(--ink-primary)' : 'transparent',
                    color: soundProfile === 'typewriter' ? 'var(--bg-primary)' : 'var(--ink-primary)'
                  }}
                >
                  TYPEWRITER
                </button>
                <button
                  type="button"
                  onClick={() => handleProfileChange('mechanical')}
                  className={`btn-secondary ${soundProfile === 'mechanical' ? 'btn-active' : ''}`}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    backgroundColor: soundProfile === 'mechanical' ? 'var(--ink-primary)' : 'transparent',
                    color: soundProfile === 'mechanical' ? 'var(--bg-primary)' : 'var(--ink-primary)'
                  }}
                >
                  MECHANICAL
                </button>
              </div>
            </div>

            {/* Volume slider */}
            <div className="setting-row">
              <div>
                <div className="setting-label">SOUND VOLUME</div>
                <div className="setting-desc">{Math.round(soundVolume * 100)}%</div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={handleVolumeChange}
                style={{ accentColor: 'var(--ink-primary)', cursor: 'pointer', width: '120px' }}
                aria-label="Sound volume"
              />
            </div>
          </>
        )}

        {/* Theme Selector */}
        <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem' }}>
          <div>
            <div className="setting-label">VISUAL THEME</div>
            <div className="setting-desc">Vintage paper, darkroom, or retro terminal</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
            {[
              { id: 'light', label: 'PAPER' },
              { id: 'dark', label: 'DARKROOM' },
              { id: 'terminal', label: 'TERMINAL' },
              { id: 'brass', label: 'BRASS' },
            ].map((theme) => {
              const isSelected = currentTheme === theme.id || (theme.id === 'light' && currentTheme === 'light');

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    document.documentElement.setAttribute('data-theme', theme.id);
                    try {
                      localStorage.setItem('typerush_theme', theme.id);
                    } catch {}
                    setCurrentTheme(theme.id);
                  }}

                  className={`btn-secondary ${isSelected ? 'btn-active' : ''}`}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.72rem',
                    backgroundColor: isSelected ? 'var(--ink-primary)' : 'transparent',
                    color: isSelected ? 'var(--bg-primary)' : 'var(--ink-primary)',
                  }}
                >
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '0.6rem 2.5rem' }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
