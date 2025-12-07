export const CONFIG = {
    FFMPEG: {
        MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
        CONCURRENCY: 2
    },
    UI: {
        SNACKBAR_DURATION: 6000,
        MAX_FILENAME_LENGTH: 50
    }
};

const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'flac'];
const SUPPORTED_VIDEO_FORMATS = ['mp4', 'avi', 'mov', 'mkv', 'webm'];

export const getAllSupportedFormats = () => {
    return [...SUPPORTED_AUDIO_FORMATS, ...SUPPORTED_VIDEO_FORMATS];
};

export const isVideoFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? SUPPORTED_VIDEO_FORMATS.includes(ext) : false;
};

export const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
