'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

// Animation for the drop zone
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    transform: scale(1.02);
    box-shadow: 0 0 0 12px rgba(25, 118, 210, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

const DropZone = styled(Box)(({ theme }) => ({
  border: '3px dashed',
  borderColor: theme.palette.primary.main,
  borderRadius: '20px',
  padding: theme.spacing(1),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(25, 118, 210, 0.05)' 
    : 'rgba(25, 118, 210, 0.03)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(25, 118, 210, 0.1)' 
      : 'rgba(25, 118, 210, 0.08)',
    transform: 'translateY(-5px)',
  },
  '&.dragging': {
    animation: `${pulse} 2s infinite`,
    borderColor: theme.palette.success.main,
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(76, 175, 80, 0.1)' 
      : 'rgba(76, 175, 80, 0.1)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(25, 118, 210, 0.15)' 
    : 'rgba(25, 118, 210, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.1)',
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(25, 118, 210, 0.25)' 
      : 'rgba(25, 118, 210, 0.2)',
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
        sx={{
          borderColor: isDragging ? 'success.main' : 'primary.main',
          backgroundColor: isDragging ? 'rgba(76, 175, 80, 0.1)' : 'rgba(25, 118, 210, 0.03)',
        }}
      >
        <IconWrapper>
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        </IconWrapper>
        
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        
        <Typography variant="h5" color="text.secondary" paragraph>
          or
        </Typography>
        
        <Typography 
          variant="h6"
          sx={{ 
            color: 'primary.main', 
            fontWeight: 'bold',
            textDecoration: 'underline',
            cursor: 'pointer',
            display: 'inline-block',
          }}
        >
          Browse files
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Supports: {supportedFormats.join(', ').toUpperCase()}
        </Typography>
      
        
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