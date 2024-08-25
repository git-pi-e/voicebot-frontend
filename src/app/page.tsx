// @/pages/page.tsx
import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import dotenv from 'dotenv';

dotenv.config();

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white p-4">
      <h1 className="text-4xl mt-4 mb-8">Customer Success Voicebot</h1>
      <ChatInterface />
    </div>
  );
};

export default Home;