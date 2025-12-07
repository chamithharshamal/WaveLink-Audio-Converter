'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

interface FFmpegContextType {
    ffmpeg: FFmpeg | null;
    loading: boolean;
    error: string | null;
    convertFile: (file: File, format: string) => Promise<{ name: string, url: string, blob: Blob }>;
    extractAudio: (file: File) => Promise<{ name: string, url: string, blob: Blob }>;
    ensureFFmpegLoaded: () => Promise<FFmpeg | null>;
}

const FFmpegContext = createContext<FFmpegContextType | undefined>(undefined);

export const useFFmpegContext = () => {
    const context = useContext(FFmpegContext);
    if (!context) {
        throw new Error('useFFmpegContext must be used within a FFmpegProvider');
    }
    return context;
};

export const FFmpegProvider = ({ children }: { children: ReactNode }) => {
    const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const initRef = useRef(false);
    const initPromiseRef = useRef<Promise<FFmpeg> | null>(null);

    const ensureFFmpegLoaded = async () => {
        if (ffmpeg) return ffmpeg;
        if (initPromiseRef.current) return initPromiseRef.current;
        if (initRef.current) return null; // Should ideally wait, but keeping simple to avoid deadlock

        initRef.current = true;
        setLoading(true);
        setError(null);

        const load = async () => {
            try {
                const ffmpegInstance = new FFmpeg();
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

                await ffmpegInstance.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });

                setFfmpeg(ffmpegInstance);
                return ffmpegInstance;
            } catch (err) {
                console.error('FFmpeg load error:', err);
                const errMsg = err instanceof Error ? err.message : 'Failed to load FFmpeg';
                setError(errMsg);
                initRef.current = false;
                initPromiseRef.current = null;
                throw new Error(errMsg);
            } finally {
                setLoading(false);
            }
        };

        initPromiseRef.current = load();
        return initPromiseRef.current;
    };

    const convertFile = async (file: File, format: string) => {
        const ffmpegInstance = await ensureFFmpegLoaded();
        if (!ffmpegInstance) throw new Error('FFmpeg not loaded');

        const fileName = file.name;
        const fileData = await file.arrayBuffer();

        await ffmpegInstance.writeFile(fileName, new Uint8Array(fileData));

        const outputName = `${fileName.split('.').slice(0, -1).join('.')}.${format}`;

        // Basic conversion command
        await ffmpegInstance.exec(['-i', fileName, outputName]);

        const data = await ffmpegInstance.readFile(outputName);
        const blob = new Blob([data], { type: `audio/${format}` });
        const url = URL.createObjectURL(blob);

        // Cleanup input file to free memory
        await ffmpegInstance.deleteFile(fileName);
        await ffmpegInstance.deleteFile(outputName);

        return { name: outputName, url, blob };
    };

    const extractAudio = async (file: File) => {
        return convertFile(file, 'mp3'); // Default to mp3 for extraction for now
    };

    return (
        <FFmpegContext.Provider value={{ ffmpeg, loading, error, convertFile, extractAudio, ensureFFmpegLoaded }}>
            {children}
        </FFmpegContext.Provider>
    );
};
