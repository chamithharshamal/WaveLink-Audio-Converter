// This file contains the FFmpeg client implementation
// We'll handle the dynamic imports carefully to avoid SSR issues

interface FFmpegResult {
  blob: Blob;
  url: string;
  name: string;
}

let ffmpegInstance: any = null;
let isInitialized = false;

export const getFFmpeg = async () => {
  // Return existing instance if already initialized
  if (isInitialized && ffmpegInstance) {
    return ffmpegInstance;
  }
  
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    throw new Error('FFmpeg can only be initialized in browser environment');
  }
  
  try {
    // Import modules at the function level
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    
    ffmpegInstance = new FFmpeg();
    
    // Load FFmpeg core - try without explicit URLs first
    await ffmpegInstance.load();
    
    isInitialized = true;
    return ffmpegInstance;
  } catch (error) {
    console.error('Failed to initialize FFmpeg:', error);
    throw new Error('Failed to initialize FFmpeg: ' + (error as Error).message);
  }
};

export const convertFile = async (file: File, outputFormat: string): Promise<FFmpegResult> => {
  try {
    const ffmpeg = await getFFmpeg();
    
    // Import fetchFile when needed
    const { fetchFile } = await import('@ffmpeg/util');
    
    const fileName = file.name;
    const outputName = `${fileName.substring(0, fileName.lastIndexOf('.')) || fileName}.${outputFormat}`;
    
    // Write file to FFmpeg FS
    await ffmpeg.writeFile(fileName, await fetchFile(file));
    
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
  } catch (error) {
    console.error('File conversion error:', error);
    throw new Error('File conversion failed: ' + (error as Error).message);
  }
};

export const extractAudio = async (file: File): Promise<FFmpegResult> => {
  try {
    const ffmpeg = await getFFmpeg();
    
    // Import fetchFile when needed
    const { fetchFile } = await import('@ffmpeg/util');
    
    const fileName = file.name;
    const outputName = `${fileName.substring(0, fileName.lastIndexOf('.')) || fileName}.mp3`;
    
    // Write file to FFmpeg FS
    await ffmpeg.writeFile(fileName, await fetchFile(file));
    
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
  } catch (error) {
    console.error('Audio extraction error:', error);
    throw new Error('Audio extraction failed: ' + (error as Error).message);
  }
};