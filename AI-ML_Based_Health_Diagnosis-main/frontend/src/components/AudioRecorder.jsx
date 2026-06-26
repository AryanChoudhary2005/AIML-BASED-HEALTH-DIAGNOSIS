import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, CheckCircle } from 'lucide-react';

const AudioRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const startVisualizer = (stream) => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#f8fafc'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(59, 130, 246)`; // blue-500
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const audioFile = new File([blob], "recording.wav", { type: "audio/wav" });
        setAudioUrl(URL.createObjectURL(audioFile));
        onRecordingComplete(audioFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startVisualizer(stream);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    cancelAnimationFrame(animationRef.current);
    audioContextRef.current?.close();
  };

  const reset = () => {
    setAudioUrl(null);
    setAudioBlob(null);
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <label className="text-sm font-bold text-slate-500 uppercase">Vocal Analysis Tool</label>
        {audioBlob && <span className="text-xs text-green-600 font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Ready</span>}
      </div>

      <canvas ref={canvasRef} width="400" height="100" className="w-full bg-white rounded-xl mb-6 shadow-inner" />

      <div className="flex items-center space-x-4">
        {!isRecording && !audioUrl ? (
          <button onClick={startRecording} className="flex-grow py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center hover:bg-blue-700 transition">
            <Mic className="mr-2" /> Start Recording
          </button>
        ) : isRecording ? (
          <button onClick={stopRecording} className="flex-grow py-4 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center animate-pulse">
            <Square className="mr-2" /> Stop & Analyze
          </button>
        ) : (
          <div className="flex-grow flex space-x-2">
            <audio src={audioUrl} controls className="flex-grow" />
            <button onClick={reset} className="p-3 bg-slate-200 rounded-xl text-slate-600 hover:bg-red-100 hover:text-red-600 transition">
              <Trash2 />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
