import { useState, useEffect } from 'react';
import { ArrowLeft, Keyboard, Power, Zap } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { Settings } from '../types';

interface SettingsPanelProps {
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SettingsPanel({ onBack, showToast }: SettingsPanelProps) {
  const [shortcut, setShortcut] = useState('CommandOrControl+Shift+Space');
  const [quickCaptureShortcut, setQuickCaptureShortcut] = useState('CommandOrControl+Shift+C');
  const [autostart, setAutostart] = useState(true);
  const [isCapturing, setIsCapturing] = useState<'main' | 'quick' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const savedSettings = await invoke<Settings>('get_settings');
        setShortcut(savedSettings.globalShortcut);
        setQuickCaptureShortcut(savedSettings.quickCaptureShortcut || 'CommandOrControl+Shift+C');

        const autostartEnabled = await isEnabled();
        setAutostart(autostartEnabled);
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [showToast]);

  // Wire Escape to go back (only when not capturing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCapturing) {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, isCapturing]);

  // Capture keyboard combination
  useEffect(() => {
    if (!isCapturing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];

      if (e.ctrlKey || e.metaKey) {
        keys.push('CommandOrControl');
      }
      if (e.shiftKey) {
        keys.push('Shift');
      }
      if (e.altKey) {
        keys.push('Alt');
      }

      const key = e.key.toUpperCase();
      if (key !== 'CONTROL' && key !== 'SHIFT' && key !== 'ALT' && key !== 'META') {
        let keyName = e.key;
        if (e.code === 'Space') {
          keyName = 'Space';
        } else if (e.code.startsWith('Key')) {
          keyName = e.code.substring(3);
        } else if (e.code.startsWith('Digit')) {
          keyName = e.code.substring(5);
        } else {
          keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
        }

        keys.push(keyName);
        const combo = keys.join('+');
        if (isCapturing === 'main') {
          setShortcut(combo);
        } else {
          setQuickCaptureShortcut(combo);
        }
        setIsCapturing(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isCapturing]);

  const toggleAutostart = () => {
    setAutostart((prev) => !prev);
  };

  const handleToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      toggleAutostart();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke('save_settings', {
        settings: {
          globalShortcut: shortcut,
          quickCaptureShortcut,
          launchAtStartup: autostart,
        },
      });

      try {
        if (autostart) {
          await enable();
        } else {
          await disable();
        }
      } catch (autostartErr: any) {
        console.warn('Autostart configuration failed:', autostartErr);
      }

      showToast('Settings saved successfully', 'success');
      onBack();
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      showToast(err.toString() || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs text-muted">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-1 select-text">
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-2.5">
          <button
            onClick={onBack}
            aria-label="Back to texts"
            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-all"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
          </button>
          <h2 className="text-sm font-semibold text-primary">Settings</h2>
        </div>
        <div className="flex items-center justify-between p-3 rounded-md border border-border bg-surface">
          <div className="flex items-center gap-2">
            <Power size={14} className="text-muted" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-primary">Launch at Startup</span>
              <span className="text-[10px] text-muted">Start Parrot on Windows log-in</span>
            </div>
          </div>
          <button
            onClick={toggleAutostart}
            onKeyDown={handleToggleKeyDown}
            role="switch"
            aria-checked={autostart}
            aria-label="Toggle launch at startup"
            className={`w-9 h-5 rounded-full relative transition-colors duration-100 ${
              autostart ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-background absolute top-0.5 left-0.5 transition-transform duration-100 ${
                autostart ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <Keyboard size={12} aria-hidden="true" />
            <span>TOGGLE SHORTCUT</span>
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={isCapturing === 'main' ? 'Press keys...' : shortcut}
              onClick={() => setIsCapturing('main')}
              aria-label="Toggle shortcut key combination"
              aria-describedby="shortcut-hint"
              className={`w-full h-9 px-3 text-[13px] rounded-md border bg-surface cursor-pointer text-left transition-all ${
                isCapturing === 'main'
                  ? 'border-accent text-accent animate-pulse ring-1 ring-accent'
                  : 'border-border text-primary hover:border-accent-dim'
              }`}
            />
            {!isCapturing && (
              <span id="shortcut-hint" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                Click to edit
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <Zap size={12} aria-hidden="true" />
            <span>QUICK CAPTURE</span>
          </div>
          <p className="text-[10px] text-muted -mt-1">Save text from any app as a new prompt</p>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={isCapturing === 'quick' ? 'Press keys...' : quickCaptureShortcut}
              onClick={() => setIsCapturing('quick')}
              aria-label="Quick capture shortcut key combination"
              aria-describedby="quick-shortcut-hint"
              className={`w-full h-9 px-3 text-[13px] rounded-md border bg-surface cursor-pointer text-left transition-all ${
                isCapturing === 'quick'
                  ? 'border-accent text-accent animate-pulse ring-1 ring-accent'
                  : 'border-border text-primary hover:border-accent-dim'
              }`}
            />
            {!isCapturing && (
              <span id="quick-shortcut-hint" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                Click to edit
              </span>
            )}
          </div>
        </div>


      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-9 rounded-md bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all mt-6"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
