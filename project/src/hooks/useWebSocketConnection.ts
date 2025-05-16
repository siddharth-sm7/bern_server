import { useState, useEffect, useRef, useCallback } from 'react';

// In a real application, this would be configured from environment variables
const WEBSOCKET_URL = 'ws://localhost:8000/ws/TEST_DEVICE_1234';

interface WebSocketHook {
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudioChunk: (chunk: Uint8Array) => void;
  responseAudio: Uint8Array | null;
}

export const useWebSocketConnection = (): WebSocketHook => {
  const [connected, setConnected] = useState<boolean>(false);
  const [responseAudio, setResponseAudio] = useState<Uint8Array | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const mockTimeoutRef = useRef<number | null>(null);
  
  // Mock a WebSocket connection for demonstration purposes
  const connect = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('Attempting to connect WebSocket...');
        
        // Mock WebSocket for demonstration
        const mockWs = {
          send: (data: any) => {
            console.log('Sending data to WebSocket:', data);
            // Simulate processing time before response
            if (mockTimeoutRef.current) {
              window.clearTimeout(mockTimeoutRef.current);
            }
            
            mockTimeoutRef.current = window.setTimeout(() => {
              console.log('Generating mock response...');
              // Mock a response after 2 seconds
              const mockResponseBuffer = new ArrayBuffer(1024);
              const mockResponse = new Uint8Array(mockResponseBuffer);
              // Fill with some dummy data (sine wave)
              for (let i = 0; i < mockResponse.length; i++) {
                mockResponse[i] = 128 + Math.floor(127 * Math.sin(i / 10));
              }
              setResponseAudio(mockResponse);
            }, 2000);
          },
          close: () => {
            console.log('WebSocket closed');
            if (mockTimeoutRef.current) {
              window.clearTimeout(mockTimeoutRef.current);
              mockTimeoutRef.current = null;
            }
            setConnected(false);
          }
        };
        
        // For demo purposes
        websocketRef.current = mockWs as unknown as WebSocket;
        setConnected(true);
        console.log('WebSocket connected (mock)');
        resolve();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }, []);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket...');
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    if (mockTimeoutRef.current) {
      window.clearTimeout(mockTimeoutRef.current);
      mockTimeoutRef.current = null;
    }
    
    setConnected(false);
  }, []);
  
  // Send audio chunk to WebSocket
  const sendAudioChunk = useCallback((chunk: Uint8Array) => {
    if (!websocketRef.current || !connected) {
      console.warn('Cannot send audio chunk: WebSocket not connected');
      return;
    }
    
    console.log('Sending audio chunk, size:', chunk.length);
    // For the mock implementation
    if (typeof websocketRef.current.send === 'function') {
      websocketRef.current.send(chunk);
    }
  }, [connected]);
  
  // Clean up on unmount
  useEffect(() => {
    console.log('WebSocket hook initialized');
    
    return () => {
      console.log('WebSocket hook cleanup');
      disconnect();
      if (mockTimeoutRef.current) {
        window.clearTimeout(mockTimeoutRef.current);
      }
    };
  }, [disconnect]);
  
  return {
    connected,
    connect,
    disconnect,
    sendAudioChunk,
    responseAudio,
  };
};