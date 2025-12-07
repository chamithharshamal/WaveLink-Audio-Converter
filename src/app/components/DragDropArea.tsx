'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

// Animation for the drop zone
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 12px rgba(33, 150, 243, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
`;

const DropZone = styled(Box)(({ theme }) => ({
  border: '2px dashed',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.3)',
  borderRadius: '24px',
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: theme.palette.mode === 'dark'
    ? 'rgba(33, 150, 243, 0.05)'
    : 'rgba(33, 150, 243, 0.02)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  '&:hover': {
    borderColor: '#2196f3',
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(33, 150, 243, 0.1)'
      : 'rgba(33, 150, 243, 0.05)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px -12px rgba(33, 150, 243, 0.5)',
  },
  '&.dragging': {
    animation: `${pulse} 1.5s infinite`,
    borderColor: '#1976d2',
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(25, 118, 210, 0.1)'
      : 'rgba(25, 118, 210, 0.05)',
    transform: 'scale(1.02)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(25, 118, 210, 0.1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  color: '#2196f3',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(25, 118, 210, 0.2))',
  },
}));

interface DragDropAreaProps {
  onFilesSelected: (files: FileList) => void;
  supportedFormats: string[];
}

export default function DragDropArea({ onFilesSelected, supportedFormats }: DragDropAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <>
      <DropZone
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={isDragging ? 'dragging' : ''}
      >
        <IconWrapper>
          <UploadIcon sx={{ fontSize: 40 }} />
        </IconWrapper>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {isDragging ? 'Drop Files Now' : 'Click or Drag Files'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: '80%' }}>
          Upload audio or video files to convert them instantly
        </Typography>

        <Box sx={{
          px: 2,
          py: 0.5,
          borderRadius: '12px',
          background: 'rgba(33, 150, 243, 0.1)',
          color: '#2196f3',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Supports: {supportedFormats.slice(0, 4).join(', ').toUpperCase()} + MORE
        </Box>


        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedFormats.map(format => `.${format}`).join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </DropZone>
    </>
  );
}