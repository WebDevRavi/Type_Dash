import React, { useState } from 'react';
import { sound, SoundProfile } from '../game/sound';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isEnabled());
  const [soundProfile, setSoundProfile] = useState<SoundProfile>(sound.getProfile());
  const [soundVolume, setSoundVolume] = useState<number>(sound.getVolume());
  const [themeDark, setThemeDark] = useState<boolean>(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
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

  const handleThemeToggle = () => {
    const next = !themeDark;
    setThemeDark(next);
    try {
      if (next) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('typerush_theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('typerush_theme', 'light');
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">SETTINGS</h2>
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

        {/* Theme Toggle */}
        <div className="setting-row">
          <div>
            <div className="setting-label">DARK THEME</div>
            <div className="setting-desc">Vintage monochrome dark room mode</div>
          </div>
          <label className="retro-switch" aria-label="Toggle dark theme">
            <input
              type="checkbox"
              checked={themeDark}
              onChange={handleThemeToggle}
            />
            <div className="retro-switch-box">
              <div className="retro-switch-nob" />
            </div>
          </label>
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
