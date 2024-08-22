import React from 'react';
import AudioRecorder from '@/components/ui/AudioRecorder';
import ChatInterface from '@/components/ChatInterface';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">Customer Success Voicebot</h1>
      <ChatInterface />
    </div>
  );
};

export default Home;