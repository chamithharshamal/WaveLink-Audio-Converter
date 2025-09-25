'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface FFmpegContextType {
  ffmpeg: any;
  loading: boolean;
  error: string | null;
  convertFile: (file: File, outputFormat: string) => Promise<any>;
  extractAudio: (file: File) => Promise<any>;
}

const FFmpegContext = createContext<FFmpegContextType | null>(null);

export function FFmpegProvider({ children }: { children: ReactNode }) {
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFFmpeg = async () => {
      try {
        // Only initialize in browser environment
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        // Import the FFmpeg client
        const { getFFmpeg } = await import('../lib/ffmpegClient');
        const ffmpegInstance = await getFFmpeg();
        
        setFfmpeg(ffmpegInstance);
        setLoading(false);
      } catch (err) {
        setError('Failed to initialize FFmpeg: ' + (err as Error).message);
        setLoading(false);
        console.error('FFmpeg initialization error:', err);
      }
    };
    
    initializeFFmpeg();
  }, []);

  // Import conversion functions
  const convertFile = async (file: File, outputFormat: string) => {
    const { convertFile: convert } = await import('../lib/ffmpegClient');
    return convert(file, outputFormat);
  };
  
  const extractAudio = async (file: File) => {
    const { extractAudio: extract } = await import('../lib/ffmpegClient');
    return extract(file);
  };

  return (
    <FFmpegContext.Provider value={{ ffmpeg, loading, error, convertFile, extractAudio }}>
      {children}
    </FFmpegContext.Provider>
  );
}

export function useFFmpegContext() {
  const context = useContext(FFmpegContext);
  if (!context) {
    throw new Error('useFFmpegContext must be used within FFmpegProvider');
  }
  return context;
}