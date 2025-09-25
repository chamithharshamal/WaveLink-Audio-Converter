'use client';

import { useState, useRef, useCallback } from 'react';

// We'll try to import the modules at the top level but handle errors gracefully
let FFmpegClass: any = null;
let fetchFileFunc: any = null;
let toBlobURLFunc: any = null;

// Try to load the modules when the file is imported
try {
  import('@ffmpeg/ffmpeg').then(module => {
    FFmpegClass = module.FFmpeg;
  }).catch(err => {
    console.warn('Failed to import @ffmpeg/ffmpeg:', err);
  });
  
  import('@ffmpeg/util').then(module => {
    fetchFileFunc = module.fetchFile;
    toBlobURLFunc = module.toBlobURL;
  }).catch(err => {
    console.warn('Failed to import @ffmpeg/util:', err);
  });
} catch (err) {
  console.warn('Failed to dynamically import FFmpeg modules:', err);
}

export const useFFmpeg = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef<any>(null);

  const initFFmpeg = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if modules are available
      if (!FFmpegClass || !toBlobURLFunc) {
        throw new Error('FFmpeg modules not available');
      }
      
      if (!ffmpegRef.current) {
        const ffmpeg = new FFmpegClass();
        
        // Load FFmpeg core using toBlobURL
        const coreURL = await toBlobURLFunc(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
          'text/javascript'
        );
        const wasmURL = await toBlobURLFunc(
          'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
          'application/wasm'
        );
        
        await ffmpeg.load({ coreURL, wasmURL });
        
        ffmpegRef.current = ffmpeg;
      }
      setLoading(false);
      return ffmpegRef.current;
    } catch (err) {
      setError('Failed to load FFmpeg: ' + (err as Error).message);
      setLoading(false);
      console.error('FFmpeg initialization error:', err);
      return null;
    }
  }, []);

  const convertFile = useCallback(async (
    file: File, 
    outputFormat: string
  ) => {
    try {
      // Check if modules are available
      if (!fetchFileFunc) {
        throw new Error('FFmpeg util modules not available');
      }
      
      const ffmpeg = await initFFmpeg();
      if (!ffmpeg) throw new Error('FFmpeg not initialized');

      const fileName = file.name;
      const outputName = `${fileName.substring(0, fileName.lastIndexOf('.')) || fileName}.${outputFormat}`;

      // Write file to FFmpeg FS
      await ffmpeg.writeFile(fileName, await fetchFileFunc(file));

      // Run conversion
      await ffmpeg.exec(['-i', fileName, outputName]);

      // Read converted file
      const data = await ffmpeg.readFile(outputName);

      // Create blob
      const blob = new Blob([data], { type: `audio/${outputFormat}` });
      
      return {
        blob,
        url: URL.createObjectURL(blob),
        name: outputName
      };
    } catch (err) {
      console.error('Conversion error:', err);
      throw new Error('File conversion failed: ' + (err as Error).message);
    }
  }, [initFFmpeg]);

  const extractAudio = useCallback(async (file: File) => {
    try {
      // Check if modules are available
      if (!fetchFileFunc) {
        throw new Error('FFmpeg util modules not available');
      }
      
      const ffmpeg = await initFFmpeg();
      if (!ffmpeg) throw new Error('FFmpeg not initialized');

      const fileName = file.name;
      const outputName = `${fileName.substring(0, fileName.lastIndexOf('.')) || fileName}.mp3`;

      // Write file to FFmpeg FS
      await ffmpeg.writeFile(fileName, await fetchFileFunc(file));

      // Run audio extraction
      await ffmpeg.exec(['-i', fileName, '-vn', '-ar', '44100', '-ac', '2', '-ab', '192k', '-f', 'mp3', outputName]);

      // Read converted file
      const data = await ffmpeg.readFile(outputName);

      // Create blob
      const blob = new Blob([data], { type: 'audio/mp3' });
      
      return {
        blob,
        url: URL.createObjectURL(blob),
        name: outputName
      };
    } catch (err) {
      console.error('Audio extraction error:', err);
      throw new Error('Audio extraction failed: ' + (err as Error).message);
    }
  }, [initFFmpeg]);

  return {
    loading,
    error,
    initFFmpeg,
    convertFile,
    extractAudio
  };
};