import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Recorder from 'recorder-js';

interface AudioRecorderProps {
  onMessageReceived: (message: { sender: 'user' | 'ai'; text: string }) => void;
  onProcessing: (state: boolean) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onMessageReceived, onProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    // Initialize AudioContext and Recorder.js
    const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newRecorder = new Recorder(newAudioContext);
    setAudioContext(newAudioContext);
    recorderRef.current = newRecorder;
  }, []);

  const handleStartRecording = async () => {
    onProcessing(true); // Disable other inputs
    console.log('initialise recorder');

    if (recorderRef.current && audioContext) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorderRef.current.init(stream);
        recorderRef.current.start();
        setIsRecording(true);
        console.log('Recording started');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        onProcessing(false); // Re-enable inputs if there's an error
      }
    }
  };

  const handleStopRecording = async () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop().then(async ({ blob }) => {
        setIsRecording(false);
        console.log('Recording stopped');

        // Log Blob type and size to ensure correctness
        console.log(`Audio Blob: ${blob.type}, size: ${blob.size/1024} kBs`);

        // Send audio to backend
        const formData = new FormData();
        formData.append('file', blob, 'recording.wav');

        try {
          // Step 1: Audio transcription
          const transURL = `${BACKEND_URL}/transcribe`;
          console.log('Transcribing audio...');

          const transcriptionResponse = await fetch(transURL, {
            method: 'POST',
            body: formData,
          });

          if (!transcriptionResponse.ok) {
            throw new Error('Failed to transcribe audio');
          }

          const transcriptionData = await transcriptionResponse.json();
          onMessageReceived({ sender: 'user', text: transcriptionData.transcript });

          // Step 2: Response generation
          const responseURL = `${BACKEND_URL}/generate`;
          const responseResponse = await fetch(responseURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: transcriptionData.transcript }),
          });
          console.log('Generating response...');
          if (!responseResponse.ok) {
            throw new Error('Failed to generate response');
          }
          const responseData = await responseResponse.json();
          console.log('Response:', responseData.response);

          onMessageReceived({ sender: 'ai', text: responseData.response });

          // Step 3: Play response audio (if available)
          if (responseData.audio) {
            // response.audio is a base64-encoded WAV file
            console.log('Playing response audio...');
            console.log('Audio Blob:', responseData.audio.data);
            const audioBlob = new Blob([new Uint8Array(responseData.audio.data)], {
              type: 'audio/wav',
            });
            const audioURL = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioURL);
            audio.play();
          }

          onProcessing(false); // Re-enable other inputs
        } catch (error) {
          console.error('Error processing audio:', error);
          onProcessing(false); // Re-enable inputs even in case of an error
          // Optionally show an error message to the user

        }
      });
    }
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
