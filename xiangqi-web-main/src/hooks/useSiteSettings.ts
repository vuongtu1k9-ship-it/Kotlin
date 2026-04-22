import { useState, useEffect } from 'react';
import { API_URL } from '../auth/auth';

let cachedSettings: Record<string, any> | null = null;
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<(s: Record<string, any>) => void>();

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, any>>(cachedSettings || {});

  useEffect(() => {
    listeners.add(setSettings);
    if (!cachedSettings && !fetchPromise) {
      fetchPromise = fetch(`${API_URL}/site-settings`)
        .then(r => r.json())
        .then(d => {
           if (d.ok) {
             cachedSettings = d.settings;
             listeners.forEach(l => l(cachedSettings!));
           }
        })
        .finally(() => { fetchPromise = null; });
    } else if (cachedSettings) {
      setSettings(cachedSettings);
    }
    return () => { listeners.delete(setSettings); };
  }, []);

  return settings;
}

export function refreshSiteSettings() {
  fetchPromise = fetch(`${API_URL}/site-settings`)
    .then(r => r.json())
    .then(d => {
        if (d.ok) {
          cachedSettings = d.settings;
          listeners.forEach(l => l(cachedSettings!));
        }
    })
    .finally(() => { fetchPromise = null; });
}
