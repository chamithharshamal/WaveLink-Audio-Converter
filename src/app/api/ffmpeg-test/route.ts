export async function GET() {
  try {
    // Test if we can access the FFmpeg core files
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    // Try to fetch the core file
    const coreResponse = await fetch(`${baseURL}/ffmpeg-core.js`);
    const wasmResponse = await fetch(`${baseURL}/ffmpeg-core.wasm`);
    
    if (!coreResponse.ok || !wasmResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch FFmpeg core files',
          coreStatus: coreResponse.status,
          wasmStatus: wasmResponse.status
        }), 
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'FFmpeg core files are accessible',
        coreSize: coreResponse.headers.get('content-length'),
        wasmSize: wasmResponse.headers.get('content-length')
      }), 
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to test FFmpeg core files: ' + (error as Error).message
      }), 
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}