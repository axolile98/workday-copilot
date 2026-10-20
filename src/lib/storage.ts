import { useEffect, useState } from "react";

export function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch { /* ignore */ }
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage may be full or disabled; keep in-memory state */ } } }, [key, v, ready]);
  return [v, setV] as const;
}

export function useSession<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const s = sessionStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch { /* ignore */ }
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch { /* storage may be full or disabled; keep in-memory state */ } } }, [key, v, ready]);
  return [v, setV] as const;
}
