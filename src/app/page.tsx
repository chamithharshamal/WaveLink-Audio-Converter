'use client';

import { useState, useCallback } from 'react';
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

// Styled components for better visual appeal
const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(145deg, #1a1a1a, #121212)' 
    : 'linear-gradient(145deg, #f0f0f0, #ffffff)',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
      : '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  padding: '6px 12px',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 1px 6px rgba(25, 118, 210, 0.3)' 
    : '0 1px 6px rgba(25, 118, 210, 0.2)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 2px 10px rgba(25, 118, 210, 0.5)' 
      : '0 2px 10px rgba(25, 118, 210, 0.3)',
    transform: 'translateY(-0.5px)',
  },
  fontSize: '0.75rem',
}));

const FileIcon = styled(Box)(({ theme }) => ({
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '10px',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #1565c0, #1976d2)' 
    : 'linear-gradient(135deg, #1976d2, #2196f3)',
  color: 'white',
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  borderRadius: '12px',
  padding: '0 5px',
  height: '20px',
  fontSize: '0.65rem',
}));

export default function AudioConverter() {
  const [files, setFiles] = useState<Array<{file: File, id: string, name: string, size: number, type: string, progress: number, status: string}>>([]);
  const [converting, setConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState<Array<{id: string, originalName: string, convertedName: string, url: string, blob: Blob, size: number}>>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [outputFormat, setOutputFormat] = useState('mp3');
  const { ffmpeg, loading, error, convertFile, extractAudio } = useFFmpegContext();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Supported formats
  const supportedFormats = ['mp3', 'wav', 'ogg', 'flac', 'mp4', 'avi', 'mov', 'mkv'];

  // Handle file selection from drag & drop or file input
  const handleFilesSelected = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Check if file is a video (needs audio extraction)
  const isVideoFile = (fileName: string) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'mkv'];
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return videoExtensions.includes(extension);
  };

  // Convert files
  const convertFiles = useCallback(async () => {
    if (files.length === 0 || !ffmpeg) return;
    
    try {
      setConverting(true);
      
      const converted = [];
      
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        const { file, name } = fileObj;
        
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress: 0, status: 'converting' } : f
        ));
        
        try {
          let result;
          
          // If it's a video file, extract audio
          if (isVideoFile(name)) {
            result = await extractAudio(file);
          } else {
            // Otherwise, convert between audio formats
            result = await convertFile(file, outputFormat);
          }
          
          converted.push({
            id: fileObj.id,
            originalName: name,
            convertedName: result.name,
            url: result.url,
            blob: result.blob,
            size: result.blob.size
          });
          
          // Update progress
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress: 100, status: 'completed' } : f
          ));
        } catch (error) {
          console.error('Conversion error:', error);
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress: 0, status: 'error' } : f
          ));
        }
      }
      
      setConvertedFiles(converted);
      setSnackbar({
        open: true,
        message: `Successfully converted ${converted.length} files`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Conversion failed:', error);
      setSnackbar({
        open: true,
        message: 'Conversion failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setConverting(false);
    }
  }, [files, ffmpeg, outputFormat, convertFile, extractAudio]);

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
  const downloadFile = (file: any) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.convertedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Get file icon based on type
  const getFileIcon = (fileName: string) => {
    if (isVideoFile(fileName)) {
      return <VideoIcon sx={{ fontSize: 16 }} />;
    }
    return <MusicIcon sx={{ fontSize: 16 }} />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header with dark mode toggle */}
      <AppBar 
        position="static" 
        sx={{ 
          borderRadius: '8px', 
          mb: 2, 
          background: darkMode 
            ? 'linear-gradient(135deg, #1a1a1a, #121212)' 
            : 'linear-gradient(135deg, #1976d2, #2196f3)',
          boxShadow: darkMode 
            ? '0 1px 6px rgba(0, 0, 0, 0.3)' 
            : '0 1px 6px rgba(25, 118, 210, 0.2)'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '48px', px: 1.5 }}>
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              background: darkMode 
                ? 'linear-gradient(90deg, #e3f2fd, #bbdefb)' 
                : 'linear-gradient(90deg, #ffffff, #e3f2fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Audio Converter Pro
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                color="default"
                icon={<LightModeIcon sx={{ transform: 'translateY(-2px)' }} />}
                checkedIcon={<DarkModeIcon sx={{ transform: 'translateY(-2px)' }} />}
                size="medium"
                sx={{
                  marginRight: '2px',
                  marginTop: '4px',
                }}
              />
            }
            label={darkMode ? "Dark" : "Light"}
            sx={{ 
              color: darkMode ? '#e3f2fd' : 'white',
              '& .MuiFormControlLabel-label': { 
                fontWeight: 'bold',
                fontSize: '0.75rem',
                ml: 1
              },
            
            }}
          />
        </Toolbar>
      </AppBar>
      
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
          Convert audio and video files to MP3, WAV, OGG, or FLAC formats
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          Drag & drop your files or click to browse. All processing happens directly in your browser - 
          your files never leave your computer.
        </Typography>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={32} thickness={5} />
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
                <FormControl fullWidth size="small" disabled={loading || !ffmpeg}>
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
                        <MusicIcon sx={{ mr: 1, fontSize: 16 }} />
                        MP3
                      </Box>
                    </MenuItem>
                    <MenuItem value="wav" sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1, fontSize: 16 }} />
                        WAV
                      </Box>
                    </MenuItem>
                    <MenuItem value="ogg" sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1, fontSize: 16 }} />
                        OGG
                      </Box>
                    </MenuItem>
                    <MenuItem value="flac" sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1, fontSize: 16 }} />
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
                              border: '1px solid #e0e0e0'
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
                                {fileObj.name.length > 30 
                                  ? `${fileObj.name.substring(0, 27)}...` 
                                  : fileObj.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(fileObj.size)}
                              </Typography>
                              
                              {fileObj.status === 'converting' && (
                                <Box sx={{ mt: 0.5 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={fileObj.progress} 
                                    sx={{ borderRadius: '3px', height: 5 }} 
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
                        disabled={converting || files.length === 0 || loading || !ffmpeg}
                        onClick={convertFiles}
                        startIcon={<PlayIcon />}
                        size="small"
                      >
                        {converting || loading ? 'Processing...' : 'Convert All'}
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
                            border: '1px solid #e0e0e0'
                          }}
                        >
                          <FileIcon sx={{ background: 'linear-gradient(135deg, #4caf50, #8bc34a)' }}>
                            <MusicIcon sx={{ fontSize: 16 }} />
                          </FileIcon>
                          
                          <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                            <Typography 
                              variant="body2" 
                              noWrap 
                              sx={{ fontWeight: 'medium', maxWidth: '200px' }}
                              title={file.convertedName}
                            >
                              {file.convertedName.length > 30 
                                ? `${file.convertedName.substring(0, 27)}...` 
                                : file.convertedName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(file.size)}
                            </Typography>
                          </Box>
                          
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                            onClick={() => downloadFile(file)}
                            sx={{ 
                              borderRadius: '14px',
                              textTransform: 'none',
                              fontWeight: 'bold',
                              px: 1,
                              py: 0.5,
                              minWidth: 'auto',
                              fontSize: '0.7rem'
                            }}
                          >
                            Download
                          </Button>
                        </Paper>
                      </Zoom>
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1.5 }}>
                    <StyledButton
                      variant="outlined"
                      onClick={downloadAll}
                      startIcon={<DownloadIcon />}
                      size="small"
                    >
                      All
                    </StyledButton>
                    <StyledButton
                      variant="outlined"
                      onClick={downloadAsZip}
                      startIcon={<ZipIcon />}
                      size="small"
                    >
                      ZIP
                    </StyledButton>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <UploadIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
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
        autoHideDuration={5000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity as any}
          sx={{ width: '100%', borderRadius: '6px', py: 1, px: 1.5 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}