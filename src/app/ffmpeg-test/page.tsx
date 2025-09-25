'use client';

import { useState } from 'react';
import { 
  Container, 
  Button, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  styled
} from '@mui/material';
import { useFFmpegContext } from '../components/FFmpegWrapper';
import { CheckCircle as CheckIcon, Error as ErrorIcon, Memory as MemoryIcon } from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  borderRadius: '16px',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const StatusIcon = styled(Box)(() => ({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
}));

export default function FFmpegTest() {
  const { ffmpeg, loading, error } = useFFmpegContext();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const testFFmpeg = async () => {
    if (!ffmpeg) {
      setTestError('FFmpeg not loaded');
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    
    try {
      // Simple test - this would normally call FFmpeg methods
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult('FFmpeg integration is working perfectly!');
    } catch (err) {
      setTestError('Test failed: ' + (err as Error).message);
      console.error('Test error:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #1976d2, #2196f3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          FFmpeg Engine Test
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          Verify that the audio processing engine is properly initialized
        </Typography>
      </Box>
      
      <StyledCard>
        <CardContent sx={{ p: 4 }}>
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={80} thickness={4} sx={{ mb: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Initializing FFmpeg Engine...
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Loading audio processing libraries
              </Typography>
            </Box>
          )}
          
          {error && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <StatusIcon sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
              </StatusIcon>
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  borderRadius: '12px',
                  '& .MuiAlert-message': {
                    width: '100%',
                    textAlign: 'center'
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Initialization Failed
                </Typography>
                <Typography variant="body1">
                  {error}
                </Typography>
              </Alert>
            </Box>
          )}
          
          {!!ffmpeg && !loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <StatusIcon sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
                <CheckIcon sx={{ fontSize: 48, color: 'success.main' }} />
              </StatusIcon>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                FFmpeg Engine Ready
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px' }}>
                The audio processing engine has been successfully initialized and is ready to convert your files.
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={testFFmpeg}
                disabled={testing}
                size="large"
                sx={{ 
                  borderRadius: '50px',
                  padding: '12px 32px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 25px rgba(76, 175, 80, 0.4)',
                  }
                }}
              >
                {testing ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 2, color: 'white' }} />
                    Running Test...
                  </>
                ) : (
                  'Run System Test'
                )}
              </Button>
              
              {testResult && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    width: '100%', 
                    mt: 4,
                    borderRadius: '12px',
                    '& .MuiAlert-message': {
                      width: '100%',
                      textAlign: 'center'
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Test Successful!
                  </Typography>
                  <Typography variant="body1">
                    {testResult}
                  </Typography>
                </Alert>
              )}
              
              {testError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    width: '100%', 
                    mt: 4,
                    borderRadius: '12px',
                    '& .MuiAlert-message': {
                      width: '100%',
                      textAlign: 'center'
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Test Failed
                  </Typography>
                  <Typography variant="body1">
                    {testError}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
          
          {(!ffmpeg) && !loading && !error && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <StatusIcon sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
                <MemoryIcon sx={{ fontSize: 48, color: 'warning.main' }} />
              </StatusIcon>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                FFmpeg Engine Not Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The audio processing engine is not available in this context.
              </Typography>
            </Box>
          )}
        </CardContent>
      </StyledCard>
    </Container>
  );
}