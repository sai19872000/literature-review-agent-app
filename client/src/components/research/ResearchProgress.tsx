import React, { useEffect, useState, useRef } from 'react';

interface ProgressProps {
  onProgressUpdate?: (data: ProgressEvent) => void;
}

interface ProgressEvent {
  stage: string;
  message: string;
  progress: number;
  data?: any;
  timestamp: string;
}

export default function ResearchProgress({ onProgressUpdate }: ProgressProps) {
  const [connected, setConnected] = useState(false);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<ProgressEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Setup WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
      
      // Send test ping
      ws.send(JSON.stringify({ type: 'ping', message: 'Hello from client' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        if (message.type === 'research_progress') {
          const progressEvent = message.data as ProgressEvent;
          progressEvent.timestamp = message.timestamp;
          
          setProgressEvents(prev => [...prev, progressEvent]);
          setLatestEvent(progressEvent);
          
          // Notify parent component if callback provided
          if (onProgressUpdate) {
            onProgressUpdate(progressEvent);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onProgressUpdate]);

  // If there's no research in progress, don't show the component
  if (!connected || !latestEvent) {
    return null;
  }
  
  // For now, we'll just show the latest progress event
  const progressValue = latestEvent.progress >= 0 ? latestEvent.progress : 0;
  
  return (
    <div className="w-full p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-100 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-blue-800">Research Progress</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            {latestEvent.stage}
          </span>
        </div>
        
        <p className="text-blue-700">{latestEvent.message}</p>
        
        <div className="w-full bg-blue-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progressValue}%` }}
          ></div>
        </div>
        
        {latestEvent.data && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            {Object.entries(latestEvent.data).map(([key, value]) => (
              <div key={key} className="mb-1">
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}