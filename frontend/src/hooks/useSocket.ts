import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Options = {
  enabled?: boolean;
  // pass-through options if needed in the future
  [key: string]: any;
};

// Creates and manages a single Socket.IO connection per url+auth combo.
// - Does NOT connect if enabled=false or if an auth.token was requested but is missing.
// - Forces websocket transport to avoid 400s from polling in some setups.
// Simple per-key cache to keep one socket instance alive app-wide
const socketCache = new Map<string, Socket>();

export const useSocket = (url: string, auth?: any, options?: Options) => {
  const { enabled = true, ...rest } = options || {};
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<Socket | null>(null);

  useEffect(() => {
    // Guard: do not connect until explicitly enabled
    if (!enabled) return;
    // Guard: if auth object provided with token field, wait until token exists
    if (auth && typeof auth === 'object' && 'token' in auth && !auth.token) return;
    if (!url) return;

    const key = `${url}::${auth?.token ?? 'no-token'}`;
    let sock = socketCache.get(key);
    if (!sock) {
      sock = io(url, {
        auth,
        // Allow polling first, then upgrade to websocket to avoid intermittent WS timeouts
        transports: ['polling', 'websocket'],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
        ...rest,
      });

      // Optional: basic debug logs to help diagnose issues
      sock.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.warn('Socket connect_error:', err?.message || err);
      });
      sock.on('disconnect', (reason) => {
        // eslint-disable-next-line no-console
        console.info('Socket disconnected:', reason);
      });

      socketCache.set(key, sock);
    } else if (sock.disconnected) {
      // Ensure it is connected
      sock.connect();
    }

    socketRef.current = sock;
    setSocketState(sock);

    return () => {
      // Do not disconnect cached socket on unmount to avoid StrictMode churn.
      // Consumers should manage room joins/leaves; socket stays alive for app lifetime.
      socketRef.current = null;
    };
  }, [url, enabled, auth?.token]);

  return socketState;
};
