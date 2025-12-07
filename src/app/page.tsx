'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  Fade,
  Zoom,
  styled,
  Switch,
  FormControlLabel,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  FolderZip as ZipIcon,
  MusicNote as MusicIcon,
  VideoFile as VideoIcon,
  UploadFile as UploadIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { useFFmpegContext } from './components/FFmpegWrapper';
import { createZipFile } from './utils/zipUtils';
import DragDropArea from './components/DragDropArea';
import { useDarkMode } from './components/ThemeProvider';
import { CONFIG, getAllSupportedFormats, isVideoFile as isVideo, formatFileSize } from './config';

// Styled components for better visual appeal
const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(30, 30, 30, 0.6)'
    : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.3)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
    : '0 8px 32px 0 rgba(33, 150, 243, 0.15)',
  borderRadius: '16px',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 12px 40px 0 rgba(0, 0, 0, 0.4)'
      : '0 12px 40px 0 rgba(33, 150, 243, 0.2)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '50px',
  padding: '8px 20px',
  fontWeight: 'bold',
  textTransform: 'none',
  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
  color: '#ffffff',
  boxShadow: '0 4px 14px 0 rgba(33, 150, 243, 0.39)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
    boxShadow: '0 6px 20px 0 rgba(33, 150, 243, 0.23)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
  },
  fontSize: '0.85rem',
}));

const FileIcon = styled(Box)(() => ({
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px',
  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(25, 118, 210, 0.1))',
  color: '#2196f3',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
}));

const StatusChip = styled(Chip)(() => ({
  fontWeight: 700,
  borderRadius: '8px',
  padding: '0 8px',
  height: '24px',
  fontSize: '0.7rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  '& .MuiChip-label': {
    paddingLeft: '8px',
    paddingRight: '8px',
  },
}));

export default function AudioConverter() {
  const [files, setFiles] = useState<Array<{ file: File, id: string, name: string, size: number, type: string, progress: number, status: string, error?: string }>>([]);
  const [converting, setConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState<Array<{ id: string, originalName: string, convertedName: string, url: string, blob: Blob, size: number }>>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [outputFormat, setOutputFormat] = useState('mp3');
  const { loading, error, convertFile, extractAudio } = useFFmpegContext();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Supported formats from config
  const supportedFormats = getAllSupportedFormats();

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      convertedFiles.forEach(file => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [convertedFiles]);

  // Handle file selection from drag & drop or file input
  const handleFilesSelected = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => {
      const tooLarge = file.size > CONFIG.FFMPEG.MAX_FILE_SIZE;

      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: tooLarge ? 'error' : 'pending',
        error: tooLarge ? `File too large (max ${formatFileSize(CONFIG.FFMPEG.MAX_FILE_SIZE)})` : undefined
      };
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Show warning if any files are too large
    const oversizedCount = newFiles.filter(f => f.status === 'error').length;
    if (oversizedCount > 0) {
      setSnackbar({
        open: true,
        message: `${oversizedCount} file(s) exceed size limit of ${formatFileSize(CONFIG.FFMPEG.MAX_FILE_SIZE)}`,
        severity: 'warning'
      });
    }
  };

  // Remove file and cleanup blob URL if converted
  const removeFile = (id: string) => {
    // Cleanup blob URL if this file was converted
    const convertedFile = convertedFiles.find(f => f.id === id);
    if (convertedFile) {
      URL.revokeObjectURL(convertedFile.url);
      setConvertedFiles(prev => prev.filter(f => f.id !== id));
    }
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Convert files - Parallel Processing
  const convertFiles = useCallback(async () => {
    if (files.length === 0) return;

    try {
      setConverting(true);

      const pendingFiles = files.filter(f => f.status !== 'completed' && f.status !== 'error');
      if (pendingFiles.length === 0) return;

      const concurrency = CONFIG.FFMPEG.CONCURRENCY;
      const results = [...convertedFiles];

      // Process files in batches
      for (let i = 0; i < pendingFiles.length; i += concurrency) {
        const batch = pendingFiles.slice(i, i + concurrency);

        await Promise.all(batch.map(async (fileObj) => {
          const { file, name } = fileObj;

          // Update status to converting
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id ? { ...f, progress: 0, status: 'converting' } : f
          ));

          try {
            let result;

            // If it's a video file, extract audio
            if (isVideo(name)) {
              result = await extractAudio(file);
            } else {
              // Otherwise, convert between audio formats
              result = await convertFile(file, outputFormat);
            }

            const converted = {
              id: fileObj.id,
              originalName: name,
              convertedName: result.name,
              url: result.url,
              blob: result.blob,
              size: result.blob.size
            };

            results.push(converted);

            // Update progress
            setFiles(prev => prev.map(f =>
              f.id === fileObj.id ? { ...f, progress: 100, status: 'completed' } : f
            ));
          } catch (error) {
            console.error('Conversion error:', error);
            setFiles(prev => prev.map(f =>
              f.id === fileObj.id ? { ...f, progress: 0, status: 'error', error: (error as Error).message } : f
            ));
          }
        }));
      }

      setConvertedFiles(results);
      setSnackbar({
        open: true,
        message: `Successfully processed files`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Conversion process failed:', error);
      setSnackbar({
        open: true,
        message: 'Some files failed to convert. Please check errors.',
        severity: 'warning'
      });
    } finally {
      setConverting(false);
    }
  }, [files, outputFormat, convertFile, extractAudio, convertedFiles]);

  // Download all converted files as individual files
  const downloadAll = () => {
    if (convertedFiles.length === 0) return;

    convertedFiles.forEach(file => {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.convertedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  // Download all converted files as a ZIP archive
  const downloadAsZip = async () => {
    if (convertedFiles.length === 0) return;

    try {
      const filesToZip = convertedFiles.map(file => ({
        name: file.convertedName,
        blob: file.blob
      }));

      const success = await createZipFile(filesToZip, 'converted-audio-files.zip');

      if (success) {
        setSnackbar({
          open: true,
          message: 'ZIP file downloaded successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to create ZIP file');
      }
    } catch (error) {
      console.error('ZIP creation error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create ZIP file',
        severity: 'error'
      });
    }
  };

  // Download individual file
  const downloadFile = (file: { url: string; convertedName: string }) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.convertedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Get file icon based on type
  const getFileIcon = (fileName: string) => {
    if (isVideo(fileName)) {
      return <VideoIcon sx={{ fontSize: 20 }} />;
    }
    return <MusicIcon sx={{ fontSize: 20 }} />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with dark mode toggle */}
      <AppBar
        position="static"
        sx={{
          borderRadius: '16px',
          mb: 4,
          background: darkMode
            ? 'rgba(30, 30, 30, 0.6)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          border: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '64px', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MusicIcon sx={{ mr: 1, color: '#2196f3' }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}
            >
              Audio Converter Pro
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                color="default"
                icon={<LightModeIcon sx={{ color: '#2196f3', transform: 'translateY(-2px)' }} />}
                checkedIcon={<DarkModeIcon sx={{ color: '#1976d2', transform: 'translateY(-2px)' }} />}
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: darkMode ? '#1976d2' : '#2196f3',
                  }
                }}
              />
            }
            label={""}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 1, fontWeight: 'medium' }}>
          Convert audio and video files to MP3, WAV, OGG, or FLAC formats
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          Drag & drop your files or click to browse. All processing happens directly in your browser -
          your files never leave your computer.
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={32} thickness={5} sx={{ color: '#2196f3' }} />
          <Typography variant="body2" sx={{ ml: 1.5, mt: 0.5 }}>
            Initializing audio processing engine...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 1.5, borderRadius: '6px', py: 1, px: 1.5 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Column - Upload Section */}
        <Box sx={{ flex: 1 }}>
          <StyledCard sx={{ p: 1.5, height: '100%' }}>
            <CardContent sx={{ "&:last-child": { pb: 1.5 } }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 1.5, fontSize: '0.9rem' }}>
                Upload Files
              </Typography>

              {/* Output Format Selector */}
              <Box sx={{ mb: 1.5 }}>
                <FormControl fullWidth size="small" disabled={loading}>
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Output Format</InputLabel>
                  <Select
                    value={outputFormat}
                    label="Output Format"
                    onChange={(e) => setOutputFormat(e.target.value as string)}
                    sx={{ borderRadius: '6px', fontSize: '0.8rem' }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 200,
                        },
                      },
                    }}
                  >
                    <MenuItem value="mp3" sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1, fontSize: 16, color: '#2196f3' }} />
                        MP3
                      </Box>
                    </MenuItem>
                    <MenuItem value="wav" sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1, fontSize: 16, color: '#2196f3' }} />
                        WAV
                      </Box>
                    </MenuItem>
                    <MenuItem value="ogg" sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1, fontSize: 16, color: '#2196f3' }} />
                        OGG
                      </Box>
                    </MenuItem>
                    <MenuItem value="flac" sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1, fontSize: 16, color: '#2196f3' }} />
                        FLAC
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Upload Area */}
              <DragDropArea
                onFilesSelected={handleFilesSelected}
                supportedFormats={supportedFormats}
              />

              {/* Selected Files */}
              {files.length > 0 && (
                <Fade in={true} timeout={300}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Selected Files ({files.length})
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {files.map((fileObj) => (
                        <Zoom in={true} style={{ transitionDelay: '50ms' }} key={fileObj.id}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <FileIcon>
                              {getFileIcon(fileObj.name)}
                            </FileIcon>

                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                noWrap
                                sx={{ fontWeight: 'medium', maxWidth: '200px' }}
                                title={fileObj.name}
                              >
                                {fileObj.name.length > CONFIG.UI.MAX_FILENAME_LENGTH
                                  ? `${fileObj.name.substring(0, CONFIG.UI.MAX_FILENAME_LENGTH - 3)}...`
                                  : fileObj.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(fileObj.size)}
                              </Typography>

                              {fileObj.error && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                  {fileObj.error}
                                </Typography>
                              )}

                              {fileObj.status === 'converting' && (
                                <Box sx={{ mt: 0.5 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={fileObj.progress}
                                    sx={{
                                      borderRadius: '3px',
                                      height: 5,
                                      '& .MuiLinearProgress-bar': {
                                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                      }
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              {fileObj.status === 'pending' && (
                                <StatusChip label="Pending" size="small" color="default" />
                              )}
                              {fileObj.status === 'converting' && (
                                <StatusChip label="Converting" size="small" color="warning" />
                              )}
                              {fileObj.status === 'completed' && (
                                <StatusChip label="Completed" size="small" color="success" />
                              )}
                              {fileObj.status === 'error' && (
                                <StatusChip label="Error" size="small" color="error" />
                              )}

                              <IconButton
                                onClick={() => removeFile(fileObj.id)}
                                size="small"
                                sx={{ mt: 0.5, p: 0.5 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        </Zoom>
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                      <StyledButton
                        variant="contained"
                        disabled={converting || files.length === 0 || files.every(f => f.status === 'error') || loading}
                        onClick={convertFiles}
                        startIcon={<PlayIcon />}
                        size="medium"
                      >
                        {converting ? 'Processing...' : loading ? 'Initializing...' : 'Convert All'}
                      </StyledButton>
                    </Box>
                  </Box>
                </Fade>
              )}
            </CardContent>
          </StyledCard>
        </Box>

        {/* Right Column - Converted Files */}
        <Box sx={{ flex: 1 }}>
          <StyledCard sx={{ p: 1.5, height: '100%' }}>
            <CardContent sx={{ "&:last-child": { pb: 1.5 } }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 1.5, fontSize: '0.9rem' }}>
                Converted Files ({convertedFiles.length})
              </Typography>

              {convertedFiles.length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {convertedFiles.map((file) => (
                      <Zoom in={true} style={{ transitionDelay: '50ms' }} key={file.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <FileIcon sx={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                            <MusicIcon sx={{ fontSize: 20, color: 'white' }} />
                          </FileIcon>

                          <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ fontWeight: 'medium', maxWidth: '200px' }}
                              title={file.convertedName}
                            >
                              {file.convertedName.length > CONFIG.UI.MAX_FILENAME_LENGTH
                                ? `${file.convertedName.substring(0, CONFIG.UI.MAX_FILENAME_LENGTH - 3)}...`
                                : file.convertedName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(file.size)}
                            </Typography>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={() => downloadFile(file)}
                            sx={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                              color: 'white',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                transform: 'scale(1.1)',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                              }
                            }}
                          >
                            <DownloadIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Paper>
                      </Zoom>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                    <StyledButton
                      variant="contained"
                      onClick={downloadAll}
                      startIcon={<DownloadIcon />}
                      size="medium"
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                        padding: '8px 24px',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      Download
                    </StyledButton>
                    <StyledButton
                      variant="contained"
                      onClick={downloadAsZip}
                      startIcon={<ZipIcon />}
                      size="medium"
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                        padding: '8px 24px',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                     ZIP
                    </StyledButton>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Converted files will appear here
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Upload and convert files to see them here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={CONFIG.UI.SNACKBAR_DURATION}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity as "success" | "info" | "warning" | "error"}
          sx={{ width: '100%', borderRadius: '6px', py: 1, px: 1.5 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
