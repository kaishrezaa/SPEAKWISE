import { spawn } from 'node:child_process';

/**
 * Converts any audio buffer (webm, ogg, etc.) to 16kHz mono 16-bit PCM WAV.
 * Gnani AI Prisma prefers 16kHz mono WAV format.
 *
 * @param {Buffer} inputBuffer - The incoming raw audio bytes (e.g. audio/webm from browser MediaRecorder)
 * @returns {Promise<Buffer>} - Standard WAV audio buffer
 */
export function convertAudioToWav(inputBuffer) {
  return new Promise((resolve, reject) => {
    // Spawn ffmpeg to read from stdin and write WAV to stdout
    const ffmpeg = spawn('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',          // Read from stdin
      '-vn',                    // Disable video
      '-ac', '1',               // 1 audio channel (mono)
      '-ar', '16000',           // 16kHz sample rate
      '-c:a', 'pcm_s16le',      // 16-bit linear PCM
      '-f', 'wav',              // WAV container
      'pipe:1',                 // Write to stdout
    ]);

    const outputChunks = [];
    let errorChunks = [];

    ffmpeg.stdout.on('data', (chunk) => {
      outputChunks.push(chunk);
    });

    ffmpeg.stderr.on('data', (chunk) => {
      errorChunks.push(chunk);
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg for audio conversion: ${err.message}`));
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(outputChunks));
      } else {
        const errorMsg = Buffer.concat(errorChunks).toString();
        reject(new Error(`FFmpeg audio conversion failed (code ${code}): ${errorMsg}`));
      }
    });

    // Feed the browser audio into ffmpeg stdin
    ffmpeg.stdin.write(inputBuffer);
    ffmpeg.stdin.end();
  });
}
