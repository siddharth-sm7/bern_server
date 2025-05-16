import { useRef, useCallback } from 'react';

interface AudioPlayerHook {
  playAudio: (audioData: Uint8Array, onComplete?: () => void) => void;
}

export const useAudioPlayer = (): AudioPlayerHook => {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Function to play audio from Uint8Array
  const playAudio = useCallback((audioData: Uint8Array, onComplete?: () => void) => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    
    // In a real application, the server would send properly formatted audio data
    // For this demo, we'll assume the data is already in a playable format 
    // and convert it to audio
    
    // For demo purposes, we'll convert the Uint8Array to a simple waveform
    // In a real app, you would decode the proper audio format from the server
    
    // Create a buffer to hold our audio data
    const bufferSize = audioData.length;
    const audioBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Fill the buffer with our audio data
    // Convert from Uint8Array to float values between -1 and 1
    for (let i = 0; i < bufferSize; i++) {
      // Convert 0-255 values to -1 to 1
      channelData[i] = (audioData[i] / 128.0) - 1.0;
    }
    
    // Create a buffer source and connect it to the destination
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    // Set up completion callback
    if (onComplete) {
      source.onended = onComplete;
    }
    
    // Play the audio
    source.start();
    
    // In a real application, you would handle more complex audio formats:
    /*
    // Decode audio data from the server
    audioContext.decodeAudioData(audioData.buffer)
      .then(decodedData => {
        // Create a buffer source and play the audio
        const source = audioContext.createBufferSource();
        source.buffer = decodedData;
        source.connect(audioContext.destination);
        
        if (onComplete) {
          source.onended = onComplete;
        }
        
        source.start();
      })
      .catch(error => {
        console.error('Error decoding audio data:', error);
      });
    */
  }, []);
  
  return { playAudio };
};