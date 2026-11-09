import { useEffect, useRef, useState } from 'preact/hooks';

interface UseAudioAnalyserProps {
  audioFile: File | null;
  isPlaying: boolean;
  trimStart: number;
  trimEnd: number;
  volume: number;
  sensitivity: number;
}

export function useAudioAnalyser({
  audioFile,
  isPlaying,
  trimStart,
  trimEnd,
  volume,
  sensitivity,
}: UseAudioAnalyserProps) {
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(64));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Initialize Audio Element and Context
  useEffect(() => {
    if (!audioFile) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;

    if (!audioElRef.current) {
      audioElRef.current = new Audio();
      audioElRef.current.crossOrigin = 'anonymous';
    }
    const audioEl = audioElRef.current;
    audioEl.src = URL.createObjectURL(audioFile);

    // Load duration
    audioEl.onloadedmetadata = () => {
      setDuration(audioEl.duration);
      setCurrentTime(0);
    };

    // Setup Analyser
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 128;
    }
    const analyser = analyserRef.current;

    // Connect
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audioEl);
      sourceRef.current.connect(analyser);
    }

    // Track time
    const onTimeUpdate = () => {
      setCurrentTime(audioEl.currentTime);
      
      // Looping logic
      if (isPlaying && audioEl.currentTime >= trimEnd) {
        audioEl.currentTime = trimStart;
      }
    };
    audioEl.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      audioEl.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [audioFile, trimStart, trimEnd, isPlaying]);

  // Play/Pause & Volume
  useEffect(() => {
    if (!audioElRef.current) return;
    if (isPlaying) {
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      if (audioElRef.current.currentTime < trimStart || audioElRef.current.currentTime >= trimEnd) {
        audioElRef.current.currentTime = trimStart;
      }
      audioElRef.current.play().catch(console.error);
    } else {
      audioElRef.current.pause();
    }
  }, [isPlaying, trimStart, trimEnd]);

  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.volume = volume;
    }
  }, [volume]);

  // Visualizer Loop
  useEffect(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateData = () => {
      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        // Apply sensitivity multiplier
        const sensitiveData = dataArray.map(val => Math.min(255, val * sensitivity));
        setAudioData(new Uint8Array(sensitiveData));
        rafRef.current = requestAnimationFrame(updateData);
      }
    };

    if (isPlaying) {
      updateData();
    } else {
      setAudioData(new Uint8Array(analyser.frequencyBinCount));
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, sensitivity]);

  // Method to scrub to a specific time
  const seek = (time: number) => {
    if (audioElRef.current) {
      audioElRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return { 
    audioData, 
    currentTime, 
    duration, 
    seek 
  };
}