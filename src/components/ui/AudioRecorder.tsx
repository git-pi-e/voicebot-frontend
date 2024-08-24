// @/components/ui/AudioRecorder.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import AudioVisualizer from '@/components/ui/AudioVisualizer';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AudioRecorder: React.FC<{ onMessageReceived: (message: Message) => void }> = ({ onMessageReceived }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const socketUrl = 'ws://127.0.0.1:8000/ws/voice';
  const { sendMessage, getWebSocket, lastMessage } = useWebSocket(socketUrl, {
    shouldReconnect: () => false,
    share: true,
  }, isRecording);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    const initializeMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
      } catch (error) {
        console.error("Error accessing the microphone:", error);
      }
    };

    initializeMediaStream();

    return () => {
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);

      if (data.type === 'speech-to-text') {
        onMessageReceived({ sender: 'user', text: data.text });
      } else if (data.type === 'llm-response') {
        onMessageReceived({ sender: 'ai', text: data.text });

        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    }
  }, [lastMessage, onMessageReceived]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const ws = getWebSocket();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.close();
    }
    setMediaStream(null);
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <Button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        variant="secondary"
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      {/* {isRecording && mediaStream && <AudioVisualizer stream={mediaStream} />} */}
    </div>
  );
};

export default AudioRecorder;
