import { useState, useEffect } from 'react';
import { ArrowLeft, Keyboard, Power, Zap, Clock } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { Settings } from '../types';

interface SettingsPanelProps {
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const RETENTION_OPTIONS = [3, 5, 10, 15, 20, 25, 30];

export function SettingsPanel({ onBack, showToast }: SettingsPanelProps) {
  const [shortcut, setShortcut] = useState('CommandOrControl+Shift+Space');
  const [quickCaptureShortcut, setQuickCaptureShortcut] = useState('CommandOrControl+Shift+C');
  const [autostart, setAutostart] = useState(true);
  const [textRetention, setTextRetention] = useState(15);
  const [imageRetention, setImageRetention] = useState(5);
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
        setTextRetention(savedSettings.textHistoryRetentionDays ?? 15);
        setImageRetention(savedSettings.imageHistoryRetentionDays ?? 5);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke('save_settings', {
        settings: {
          globalShortcut: shortcut,
          quickCaptureShortcut,
          launchAtStartup: autostart,
          textHistoryRetentionDays: textRetention,
          imageHistoryRetentionDays: imageRetention,
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-1 select-text">
      <div className="flex-1 overflow-y-auto pr-0.5 space-y-5">
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
            onClick={() => setAutostart(!autostart)}
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

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
            <Clock size={12} aria-hidden="true" />
            <span>HISTORY RETENTION</span>
          </div>

          <div className="flex flex-col gap-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary">Text history</span>
              <select
                value={textRetention}
                onChange={(e) => setTextRetention(Number(e.target.value))}
                className="h-7 px-2 text-xs rounded-md bg-surface-hover border border-border text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                {RETENTION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-primary">Image history</span>
                <span className="text-[9px] text-muted">Images use more disk space</span>
              </div>
              <select
                value={imageRetention}
                onChange={(e) => setImageRetention(Number(e.target.value))}
                className="h-7 px-2 text-xs rounded-md bg-surface-hover border border-border text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                {RETENTION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>

            {imageRetention > 10 && (
              <div className="px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-500">
                Longer image retention uses more disk space. Stored on your device only.
              </div>
            )}
          </div>
        </div>


      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-9 rounded-md bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all mt-4"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
