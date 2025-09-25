'use client';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const createZipFile = async (files: { name: string; blob: Blob }[], zipName: string = 'converted-files.zip') => {
  try {
    const zip = new JSZip();
    
    // Add files to zip
    files.forEach(file => {
      zip.file(file.name, file.blob);
    });
    
    // Generate zip file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Download zip file
    saveAs(content, zipName);
    
    return true;
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    return false;
  }
};