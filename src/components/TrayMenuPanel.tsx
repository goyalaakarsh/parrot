import { invoke } from '@tauri-apps/api/core';

// No props needed anymore since it calls Rust commands directly
export function TrayMenuPanel() {
  const handleOpen = async () => {
    try {
      await invoke('open_main_window', { view: 'list' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettings = async () => {
    try {
      await invoke('open_main_window', { view: 'settings' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuit = async () => {
    try {
      await invoke('exit_app');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-[140px] h-[115px] bg-[#1e1e1e] border border-[#2d2d2d] rounded-md shadow-lg flex flex-col py-1.5 text-left font-sans select-none overflow-hidden">
      <button
        onClick={handleOpen}
        className="w-full px-4 py-1.5 text-xs text-[#e0e0e0] hover:bg-[#2a2a2a] transition-all text-left font-normal focus:outline-none"
      >
        Open
      </button>
      <button
        onClick={handleSettings}
        className="w-full px-4 py-1.5 text-xs text-[#e0e0e0] hover:bg-[#2a2a2a] transition-all text-left font-normal focus:outline-none"
      >
        Settings
      </button>
      <div className="h-px bg-[#2d2d2d] my-1" />
      <button
        onClick={handleQuit}
        className="w-full px-4 py-1.5 text-xs text-[#e0e0e0] hover:bg-[#2a2a2a] transition-all text-left font-normal focus:outline-none"
      >
        Quit
      </button>
    </div>
  );
}
