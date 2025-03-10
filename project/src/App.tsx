import React, { useState, useRef } from 'react';
import { Mic, MicOff, FileText, Settings, AlertCircle, Download, X } from 'lucide-react';

type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'complete' | 'error';

interface ErrorState {
  message: string;
  details?: string;
}

function App() {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<ErrorState | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
      };
      
      mediaRecorder.start();
      setStatus('recording');
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError({
        message: 'Microphone Access Error',
        details: 'Please ensure you have granted microphone permissions and try again.'
      });
      setStatus('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && streamRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      setStatus('transcribing');
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      // TODO: Replace with actual transcription service
      // Simulated transcription for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      const simulatedTranscript = "This is a simulated transcript. In a real implementation, this would be replaced with actual transcribed text from your audio recording.";
      setTranscript(simulatedTranscript);
      setStatus('complete');
    } catch (err) {
      console.error('Transcription error:', err);
      setError({
        message: 'Transcription Failed',
        details: 'There was an error transcribing your audio. Please try again.'
      });
      setStatus('error');
    }
  };

  const handleDownload = () => {
    const fileBlob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDismissError = () => {
    setError(null);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Voice-to-Doc</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center justify-center space-y-8">
            {/* Error Display */}
            {error && (
              <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">{error.message}</h3>
                    <p className="mt-1 text-sm text-red-700">{error.details}</p>
                  </div>
                  <button
                    onClick={handleDismissError}
                    className="ml-4 text-red-400 hover:text-red-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Recording Status Circle */}
            <div className="relative">
              <div className={`
                w-48 h-48 rounded-full flex items-center justify-center
                ${status === 'idle' ? 'bg-gray-100' : ''}
                ${status === 'recording' ? 'bg-red-50 animate-pulse' : ''}
                ${status === 'transcribing' ? 'bg-yellow-50' : ''}
                ${status === 'complete' ? 'bg-green-50' : ''}
                ${status === 'error' ? 'bg-red-50' : ''}
              `}>
                <button
                  onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
                  disabled={status === 'transcribing'}
                  className={`
                    w-32 h-32 rounded-full flex items-center justify-center
                    transition-all duration-200 ease-in-out
                    ${status === 'recording' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'}
                    ${status === 'transcribing' ? 'opacity-50 cursor-not-allowed' : ''}
                    ${status === 'error' ? 'bg-red-600' : ''}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {status === 'recording' ? (
                    <MicOff className="h-12 w-12 text-white" />
                  ) : (
                    <Mic className="h-12 w-12 text-white" />
                  )}
                </button>
              </div>
              
              {/* Status Text */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-500">
                  {status === 'idle' && 'Click to start recording'}
                  {status === 'recording' && 'Recording in progress...'}
                  {status === 'transcribing' && 'Transcribing...'}
                  {status === 'complete' && 'Recording complete!'}
                  {status === 'error' && 'Recording failed'}
                </span>
              </div>
            </div>

            {/* Transcript Display */}
            {status === 'complete' && transcript && (
              <div className="w-full max-w-2xl mt-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            {status === 'idle' && (
              <div className="mt-12 bg-blue-50 rounded-lg p-4 max-w-md w-full">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">How it works</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>1. Click the microphone button to start recording your meeting</p>
                      <p>2. Click again to stop when you're finished</p>
                      <p>3. Wait for the transcription to complete</p>
                      <p>4. Download your formatted document with transcript and summary</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;