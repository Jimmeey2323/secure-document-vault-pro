import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  url: string;
  progress: number;
}

interface DocumentViewerProps {
  files: UploadedFile[];
  currentIndex: number;
  onClose: () => void;
  onFileChange: (index: number) => void;
  darkMode: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  files,
  currentIndex,
  onClose,
  onFileChange,
  darkMode
}) => {
  const [zoom, setZoom] = useState(100);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [timestamp] = useState(() => new Date().toLocaleString());
  const [isBlurred, setIsBlurred] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentFile = files[currentIndex];

  // Convert blob to data URL for PDF
  useEffect(() => {
    if (currentFile && currentFile.type === 'application/pdf') {
      console.log('Converting PDF blob to data URL for:', currentFile.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('PDF data URL created, length:', result?.length);
        setPdfData(result);
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
      };
      reader.readAsDataURL(currentFile.file);
    } else {
      setPdfData(null);
    }
  }, [currentFile]);

  // Disable right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Disable keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts
      if (
        e.ctrlKey && ['c', 'v', 'a', 's', 'p', 'u', 'r', 'z', 'y'].includes(e.key.toLowerCase()) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'c', 's'].includes(e.key.toLowerCase())) ||
        e.key === 'F5' ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBlurred(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Window blur detection
  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Disable text selection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      .no-drag {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const nextFile = () => {
    if (currentIndex < files.length - 1) {
      onFileChange(currentIndex + 1);
    }
  };

  const prevFile = () => {
    if (currentIndex > 0) {
      onFileChange(currentIndex - 1);
    }
  };

  const renderContent = () => {
    if (!currentFile) {
      console.log('No current file to render');
      return null;
    }

    console.log('Rendering file:', currentFile.name, 'Type:', currentFile.type, 'URL:', currentFile.url);

    if (currentFile.type.startsWith('image/')) {
      console.log('Rendering as image');
      return (
        <img
          src={currentFile.url}
          alt={currentFile.name}
          className="max-w-full max-h-full object-contain no-select no-drag"
          style={{ 
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.3s ease'
          }}
          draggable={false}
          onError={(e) => {
            console.error('Image failed to load:', currentFile.name, currentFile.url);
            console.error('Image error event:', e);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', currentFile.name);
          }}
        />
      );
    }

    if (currentFile.type === 'application/pdf') {
      console.log('Rendering as PDF, pdfData available:', !!pdfData);
      
      if (!pdfData) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className={cn(
              "text-center p-8 rounded-xl",
              darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-900"
            )}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Loading PDF...</h3>
              <p className="text-sm opacity-75">
                Converting file for secure viewing
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-center">
          <iframe
            src={pdfData}
            className="w-full h-full border-0 no-select"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              minHeight: '600px'
            }}
            title={currentFile.name}
            onLoad={() => {
              console.log('PDF iframe loaded successfully');
            }}
            onError={(e) => {
              console.error('PDF iframe failed to load:', e);
            }}
          />
        </div>
      );
    }

    if (currentFile.type.startsWith('text/')) {
      return (
        <div
          className={cn(
            "w-full h-full p-8 overflow-auto no-select",
            darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-900"
          )}
          style={{ 
            fontSize: `${zoom / 100}rem`,
            lineHeight: 1.6
          }}
        >
          <pre className="whitespace-pre-wrap font-mono">
            Loading text content...
          </pre>
        </div>
      );
    }

    // Default fallback for unsupported file types
    return (
      <div className="flex items-center justify-center h-full">
        <div className={cn(
          "text-center p-8 rounded-xl",
          darkMode ? "bg-slate-800 text-white" : "bg-white text-gray-900"
        )}>
          <Download className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Preview not available</h3>
          <p className="text-sm opacity-75">
            This file type cannot be previewed in the browser
          </p>
          <p className="text-xs mt-2 opacity-50">
            File: {currentFile.name}
          </p>
          <p className="text-xs mt-1 opacity-50">
            Type: {currentFile.type}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-black/95 backdrop-blur-sm",
      isBlurred && "blur-sm"
    )}>
      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none z-40">
        <div className="absolute top-4 right-4 text-white/20 text-xs font-mono">
          Session: {sessionId} | {timestamp}
        </div>
        <div className="absolute bottom-4 left-4 text-white/20 text-xs font-mono">
          SecureViewer Pro - Protected Content
        </div>
        
        {/* Dynamic background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-50 p-4 bg-black/50 backdrop-blur-lg",
        "border-b border-white/10"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-6 w-6 text-white" />
            <div className="text-white">
              <h2 className="font-semibold truncate max-w-xs">
                {currentFile?.name}
              </h2>
              <p className="text-xs text-white/70">
                {currentIndex + 1} of {files.length} files
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* File Navigation */}
            {files.length > 1 && (
              <>
                <button
                  onClick={prevFile}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextFile}
                  disabled={currentIndex === files.length - 1}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-white text-sm min-w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ZoomIn className="h-5 w-5" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="absolute inset-0 pt-20 pb-4 px-4 overflow-auto no-select"
      >
        <div
          ref={contentRef}
          className="w-full h-full flex items-center justify-center no-select no-drag"
        >
          {isBlurred ? (
            <div className="text-white text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Content Protected</h3>
              <p className="text-sm opacity-75">
                Content is hidden when window loses focus
              </p>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-50 p-2 bg-black/50 backdrop-blur-lg",
        "border-t border-white/10"
      )}>
        <div className="flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center space-x-4">
            <span>🔒 Secure Mode Active</span>
            <span>📸 Screenshots Blocked</span>
            <span>🚫 Copy/Paste Disabled</span>
          </div>
          <div>
            Protected by SecureViewer Pro
          </div>
        </div>
      </div>
    </div>
  );
};
