// @/components/ui/AudioRecorder.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  onMessageReceived: (message: { sender: 'user' | 'ai'; text: string }) => void;
  onProcessing: (state: boolean) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onMessageReceived, onProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const handleStartRecording = () => {
    onProcessing(true); // Disable other inputs
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.start();

      recorder.ondataavailable = event => {
        setAudioChunks(prev => [...prev, event.data]);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

        // Send audio to backend
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');

        try {
          // Step 1: Transcription
          const transcriptionResponse = await fetch('http://your-backend-url/transcribe', {
            method: 'POST',
            body: formData,
          });
          const transcriptionData = await transcriptionResponse.json();
          onMessageReceived({ sender: 'user', text: transcriptionData.transcript });

          // Step 2: Response generation
          const responseResponse = await fetch('http://your-backend-url/generate-response', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: transcriptionData.transcript }),
          });
          const responseData = await responseResponse.json();
          onMessageReceived({ sender: 'ai', text: responseData.response });

          // Step 3: Play response audio (if available)
          if (responseData.audio) {
            const audioUrl = URL.createObjectURL(new Blob([responseData.audio], { type: 'audio/wav' }));
            const audio = new Audio(audioUrl);
            audio.play();
          }

          onProcessing(false); // Re-enable other inputs

        } catch (error) {
          console.error('Error processing audio:', error);
          onProcessing(false); // Re-enable inputs even in case of an error
        }

        setAudioChunks([]); // Reset audio chunks for next recording
      };
    });
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setIsRecording(false);
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
