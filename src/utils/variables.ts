import { readText } from '@tauri-apps/plugin-clipboard-manager';

const AUTO_VARIABLES = ['clipboard', 'date', 'time'];

export function extractVariables(text: string): { autoVars: string[]; customVars: string[] } {
  const regex = /\{([a-zA-Z0-9_]+)\}/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1]);
  }

  const autoVars: string[] = [];
  const customVars: string[] = [];

  matches.forEach((varName) => {
    if (AUTO_VARIABLES.includes(varName.toLowerCase())) {
      autoVars.push(varName.toLowerCase());
    } else {
      customVars.push(varName);
    }
  });

  return { autoVars, customVars };
}

export async function evaluateTemplate(
  text: string,
  customValues: Record<string, string> = {}
): Promise<string> {
  let result = text;

  // Replace {clipboard}
  if (result.includes('{clipboard}')) {
    try {
      const cbText = (await readText()) || '';
      result = result.replace(/\{clipboard\}/gi, cbText);
    } catch {
      result = result.replace(/\{clipboard\}/gi, '');
    }
  }

  // Replace {date}
  if (result.includes('{date}')) {
    const today = new Date().toISOString().split('T')[0];
    result = result.replace(/\{date\}/gi, today);
  }

  // Replace {time}
  if (result.includes('{time}')) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    result = result.replace(/\{time\}/gi, timeStr);
  }

  // Replace custom variables
  Object.entries(customValues).forEach(([key, val]) => {
    const reg = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(reg, val);
  });

  return result;
}

