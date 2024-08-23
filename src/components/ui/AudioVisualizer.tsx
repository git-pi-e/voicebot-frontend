import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream;
}

const AudioVisualizer = ({ stream }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioCtx = new (window.AudioContext)();
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 32;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let audioBuffer: Float32Array[] = [];

        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext('2d');

        const draw = () => {
          requestAnimationFrame(draw);

          analyserNode.getByteFrequencyData(dataArray);

          if (canvasCtx && canvas) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / 20;
            const barSpacing = canvas.width / 10;
            const maxBarHeight = canvas.height * 0.75;
            const circleRadius = barWidth / 2;
            const minBarHeight = canvas.height / 20;

            for (let i = 0; i < 7; i++) {
              const index = i % 2 !== 0 ? 9 - 1 - i : i;
              const value = dataArray[index];
              const x = 40 + barSpacing * (i + 1);
              let barHeight = (value / 255) * maxBarHeight;

              if (barHeight < minBarHeight) {
                barHeight = minBarHeight;
              }

              canvasCtx.fillStyle = 'rgba(0, 0, 0, 1)';
              canvasCtx.fillRect(
                x - barWidth / 2,
                canvas.height / 2 - barHeight / 2,
                barWidth,
                barHeight
              );

              canvasCtx.beginPath();
              canvasCtx.arc(x, canvas.height / 2 - barHeight / 2, circleRadius, 0, Math.PI, true);
              canvasCtx.fill();

              canvasCtx.beginPath();
              canvasCtx.arc(x, canvas.height / 2 + barHeight / 2, circleRadius, 0, Math.PI, false);
              canvasCtx.fill();
            }
          }
        };

        const scriptNode = audioCtx.createScriptProcessor(1024, 1, 1);
        source.connect(scriptNode);
        scriptNode.connect(audioCtx.destination);

        scriptNode.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          audioBuffer.push(new Float32Array(inputData));
          if (audioBuffer.length > audioCtx.sampleRate) {
            audioBuffer = audioBuffer.slice(audioBuffer.length - audioCtx.sampleRate);
          }
        };

        draw();

      } catch (err: any) {
        setError('Error accessing the microphone: ' + err.message);
        console.error('Error accessing the microphone', err);
      }
    };

    initAudio();

    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasCtx = canvas.getContext('2d');
        canvasCtx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [stream]);

  return (
    <div className="audio-visualizer-container">
      <canvas ref={canvasRef} width={400} height={300} />
      {error && <p>{error}</p>}
    </div>
  );
}

export default AudioVisualizer;
