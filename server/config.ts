import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'settings.json');

export interface AppConfig {
  geminiApiKey: string;
  setupComplete: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  geminiApiKey: '',
  setupComplete: false
};

// Ensure config directory exists
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfig(): AppConfig {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }
  
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Partial<AppConfig>): AppConfig {
  ensureConfigDir();
  
  const current = getConfig();
  const updated = { ...current, ...config };
  
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

export function isConfigured(): boolean {
  const config = getConfig();
  return config.setupComplete && !!config.geminiApiKey;
}
