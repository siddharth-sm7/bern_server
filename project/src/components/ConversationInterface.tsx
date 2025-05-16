import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useWebSocketConnection } from '../hooks/useWebSocketConnection';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import AudioVisualizer from './AudioVisualizer';

type ConversationState = 'idle' | 'listening' | 'processing' | 'responding' | 'error';

const ConversationInterface: React.FC = () => {
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    audioData,
    audioAnalyser,
    hasPermission,
    permissionError,
    requestPermission
  } = useAudioRecorder();
  
  const { 
    connected, 
    connect, 
    disconnect, 
    sendAudioChunk, 
    responseAudio
  } = useWebSocketConnection();
  
  const { playAudio } = useAudioPlayer();
  const audioChunksRef = useRef<Uint8Array[]>([]);

  useEffect(() => {
    if (isRecording && conversationState !== 'listening') {
      setConversationState('listening');
    } else if (!isRecording && conversationState === 'listening') {
      setConversationState('processing');
    }
  }, [isRecording, conversationState]);

  useEffect(() => {
    if (audioData && conversationState === 'listening') {
      audioChunksRef.current.push(audioData);
      sendAudioChunk(audioData);
    }
  }, [audioData, conversationState, sendAudioChunk]);

  useEffect(() => {
    if (responseAudio && conversationState === 'processing') {
      setConversationState('responding');
      playAudio(responseAudio, () => {
        setConversationState('idle');
      });
    }
  }, [responseAudio, conversationState, playAudio]);

  useEffect(() => {
    if (permissionError) {
      setErrorMessage(permissionError);
      setConversationState('error');
    }
  }, [permissionError]);

  const handleStartConversation = async () => {
    if (conversationState !== 'idle') return;
    
    audioChunksRef.current = [];
    setErrorMessage('');
    
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          return; // Error message is set by the hook
        }
      }
      
      if (!connected) {
        await connect();
      }
      
      startRecording();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setConversationState('error');
    }
  };

  const handleStopConversation = () => {
    if (conversationState !== 'listening') return;
    stopRecording();
  };

  const handleRetry = () => {
    setConversationState('idle');
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300">
      <div className="flex flex-col items-center">
        <div className="w-full h-32 mb-6 flex items-center justify-center">
          {conversationState === 'listening' && audioAnalyser ? (
            <AudioVisualizer audioAnalyser={audioAnalyser} />
          ) : (
            <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${getStateBackground(conversationState)}`}>
              {getStateIcon(conversationState)}
            </div>
          )}
        </div>

        <div className="h-8 mb-6 text-center">
          {conversationState === 'error' ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <p className="text-gray-700">{getStateMessage(conversationState)}</p>
          )}
        </div>

        <button
          onClick={
            conversationState === 'idle' 
              ? handleStartConversation 
              : conversationState === 'listening' 
                ? handleStopConversation 
                : conversationState === 'error' 
                  ? handleRetry 
                  : undefined
          }
          disabled={conversationState === 'processing' || conversationState === 'responding'}
          className={`px-8 py-4 rounded-full font-medium text-white transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            conversationState === 'idle' || conversationState === 'error'
              ? 'bg-blue-500 hover:bg-blue-600'
              : conversationState === 'listening'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {conversationState === 'idle'
            ? 'Start Conversation'
            : conversationState === 'listening'
              ? 'Stop Listening'
              : conversationState === 'error'
                ? 'Try Again'
                : conversationState === 'processing'
                  ? 'Processing...'
                  : 'Responding...'}
        </button>
      </div>
    </div>
  );
};

const getStateMessage = (state: ConversationState): string => {
  switch (state) {
    case 'idle':
      return 'Click the button to start a conversation';
    case 'listening':
      return 'Listening to your voice...';
    case 'processing':
      return 'Processing your request...';
    case 'responding':
      return 'Playing response...';
    default:
      return '';
  }
};

const getStateBackground = (state: ConversationState): string => {
  switch (state) {
    case 'idle':
      return 'bg-gray-100';
    case 'listening':
      return 'bg-blue-100';
    case 'processing':
      return 'bg-purple-100';
    case 'responding':
      return 'bg-green-100';
    case 'error':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
};

const getStateIcon = (state: ConversationState) => {
  switch (state) {
    case 'idle':
      return <Mic className="h-12 w-12 text-blue-500" />;
    case 'listening':
      return <Mic className="h-12 w-12 text-blue-600 animate-pulse" />;
    case 'processing':
      return <Loader className="h-12 w-12 text-purple-600 animate-spin" />;
    case 'responding':
      return <Volume2 className="h-12 w-12 text-green-600" />;
    case 'error':
      return <MicOff className="h-12 w-12 text-red-500" />;
    default:
      return <Mic className="h-12 w-12 text-blue-500" />;
  }
};

export default ConversationInterface;