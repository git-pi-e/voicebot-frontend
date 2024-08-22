// @/components/ui/AudioRecorder.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import useWebSocket, { ReadyState } from 'react-use-websocket';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AudioRecorder: React.FC<{ onMessageReceived: (message: Message) => void }> = ({ onMessageReceived }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const socketUrl = 'ws://localhost:8080/audio';
  const { sendMessage, getWebSocket, lastMessage } = useWebSocket(socketUrl, {
    shouldReconnect: () => false,  // No automatic reconnect
    share: true,  // Reuse the WebSocket connection across components
  }, isRecording);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Get media stream when the component mounts
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
      // Cleanup: stop any active tracks when the component unmounts
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isRecording && mediaRecorder) {
      try {
        mediaRecorder.start(1000); // Chunk every 1000ms
      } catch (error) {
        console.error("Error starting MediaRecorder:", error);
      }
    }
  }, [isRecording, mediaRecorder]);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);

      if (data.type === 'speech-to-text') {
        // First output the speech-to-text result
        onMessageReceived({ sender: 'user', text: data.text });
      } else if (data.type === 'llm-response') {
        // Then output the LLM processed response (both text and voice)
        onMessageReceived({ sender: 'ai', text: data.text });

        // Optionally, handle voice output (play the audio)
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    }
  }, [lastMessage, onMessageReceived]);

  const handleStartRecording = async () => {
    if (!mediaStream) {
      console.error("No media stream available for recording.");
      return;
    }

    const recorder = new MediaRecorder(mediaStream);

    recorder.ondataavailable = (event) => {
      const ws = getWebSocket();
      if (ws?.readyState === WebSocket.OPEN) {
        sendMessage(event.data);
      }
    };

    mediaRecorderRef.current = recorder;
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    // Close the WebSocket connection manually
    const ws = getWebSocket();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.close();
    }

    // Reset media stream
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
    </div>
  );
};

export default AudioRecorder;
