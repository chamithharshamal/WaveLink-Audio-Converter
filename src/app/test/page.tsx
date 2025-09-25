'use client';

import { useState } from 'react';
import { Container, Button, Typography, Box, CircularProgress } from '@mui/material';

export default function TestFFmpeg() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testFFmpeg = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Dynamically import FFmpeg
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      
      const ffmpeg = new FFmpeg();
      
      // Load FFmpeg core
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setResult('FFmpeg loaded successfully!');
    } catch (err) {
      setError('Failed to load FFmpeg: ' + (err as Error).message);
      console.error('FFmpeg test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        FFmpeg Test
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 4 }}>
        <Button 
          variant="contained" 
          onClick={testFFmpeg}
          disabled={loading}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : 'Test FFmpeg'}
        </Button>
        
        {result && (
          <Typography variant="h6" color="success.main">
            {result}
          </Typography>
        )}
        
        {error && (
          <Typography variant="h6" color="error.main">
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
}