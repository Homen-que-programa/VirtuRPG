import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string, auth?: any) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(url, { auth });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url, auth]);

  return socketRef.current;
};
