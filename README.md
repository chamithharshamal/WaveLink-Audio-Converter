# WaveLink - Audio Converter Pro

A Next.js application for bulk audio conversion with client-side processing using ffmpeg.wasm. This app allows users to convert audio files between different formats (MP3, WAV, OGG, FLAC) and extract audio from video files, all processed directly in the browser without server storage.

## Features

- Upload multiple audio/video files with drag & drop
- Convert between MP3, WAV, OGG, FLAC formats
- Extract audio from video files (MP4, AVI, MOV, MKV)
- All processing happens client-side using ffmpeg.wasm
- Bulk download of converted files or ZIP archive
- Modern, responsive UI with Material UI components
- Visual progress indicators for each file conversion
- Beautiful animations and transitions
- Fully responsive design for all devices

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd audio-converter
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

#### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Deployment

This application can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Sign in to [Vercel](https://vercel.com)
3. Create a new project and import your repository
4. Vercel will automatically detect the Next.js framework and configure the build settings
5. Deploy the project

## How It Works

1. **Client-Side Processing**: All audio conversion is performed directly in the browser using ffmpeg.wasm, eliminating the need for server-side processing and storage.

2. **File Upload**: Users can upload multiple audio or video files through drag & drop or file selection.

3. **Format Conversion**: 
   - Audio files can be converted between MP3, WAV, OGG, and FLAC formats
   - Video files have their audio extracted and saved as MP3 files

4. **Download Options**: 
   - Download individual converted files
   - Download all converted files as a ZIP archive

## Supported Formats

### Input Formats
- Audio: MP3, WAV, OGG, FLAC
- Video: MP4, AVI, MOV, MKV

### Output Formats
- MP3, WAV, OGG, FLAC

## Technical Details

- **Framework**: Next.js 15 with App Router
- **UI Library**: Material UI with custom styling
- **Audio Processing**: ffmpeg.wasm
- **File Handling**: JSZip for ZIP archive creation
- **Styling**: Tailwind CSS with custom CSS enhancements

## UI Features

- **Modern Design**: Clean, gradient-based design with smooth animations
- **Drag & Drop**: Intuitive file upload with visual feedback
- **Progress Indicators**: Real-time progress bars for each file
- **Responsive Layout**: Works on mobile, tablet, and desktop devices
- **Visual Feedback**: Color-coded status indicators and hover effects
- **Accessibility**: Proper focus states and semantic HTML

## Limitations

1. **Browser Compatibility**: Requires a modern browser with WebAssembly support
2. **File Size**: Large files may take longer to process and could potentially cause browser memory issues
3. **Performance**: Processing speed depends on the user's device capabilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.