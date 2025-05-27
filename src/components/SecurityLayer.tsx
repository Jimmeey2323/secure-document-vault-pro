
import React, { useEffect, useState } from 'react';

interface SecurityLayerProps {
  children: React.ReactNode;
}

export const SecurityLayer: React.FC<SecurityLayerProps> = ({ children }) => {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [screenCaptureAttempt, setScreenCaptureAttempt] = useState(false);

  useEffect(() => {
    // Developer tools detection
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        setDevToolsOpen(true);
        console.clear();
        console.log('%cSecureViewer Pro', 'color: red; font-size: 30px; font-weight: bold;');
        console.log('%cDeveloper tools detected. Access denied for security reasons.', 'color: red; font-size: 16px;');
      } else {
        setDevToolsOpen(false);
      }
    };

    const interval = setInterval(detectDevTools, 500);

    // Clear console periodically
    const consoleCleaner = setInterval(() => {
      console.clear();
    }, 1000);

    // Disable F12 and other developer shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        setDevToolsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      clearInterval(consoleCleaner);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // Screen capture detection
    const detectScreenCapture = async () => {
      try {
        // Check if screen capture API is being used
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
          navigator.mediaDevices.getDisplayMedia = function() {
            setScreenCaptureAttempt(true);
            return Promise.reject(new Error('Screen capture blocked by SecureViewer Pro'));
          };
        }
      } catch (error) {
        console.log('Screen capture protection active');
      }
    };

    detectScreenCapture();

    // Disable clipboard access
    const blockClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('paste', blockClipboard);

    // Disable drag and drop
    const blockDragDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener('dragstart', blockDragDrop);
    document.addEventListener('drag', blockDragDrop);
    document.addEventListener('dragenter', blockDragDrop);
    document.addEventListener('dragover', blockDragDrop);
    document.addEventListener('drop', blockDragDrop);

    // Disable print
    const blockPrint = () => {
      return false;
    };

    window.addEventListener('beforeprint', blockPrint);

    return () => {
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('paste', blockClipboard);
      document.removeEventListener('dragstart', blockDragDrop);
      document.removeEventListener('drag', blockDragDrop);
      document.removeEventListener('dragenter', blockDragDrop);
      document.removeEventListener('dragover', blockDragDrop);
      document.removeEventListener('drop', blockDragDrop);
      window.removeEventListener('beforeprint', blockPrint);
    };
  }, []);

  useEffect(() => {
    // DOM mutation observer to prevent content extraction
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Add protection attributes to new elements
              element.setAttribute('data-protected', 'true');
              element.addEventListener('selectstart', (e) => e.preventDefault());
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  if (devToolsOpen) {
    return (
      <div className="fixed inset-0 bg-red-900 text-white flex items-center justify-center z-[9999]">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-lg mb-2">Developer tools detected</p>
          <p className="text-sm opacity-75">Close developer tools to continue</p>
        </div>
      </div>
    );
  }

  if (screenCaptureAttempt) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[9999]">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📸</div>
          <h1 className="text-3xl font-bold mb-4">Screen Capture Blocked</h1>
          <p className="text-lg mb-2">Screen recording/capture attempt detected</p>
          <p className="text-sm opacity-75">This content is protected from capture</p>
          <button
            onClick={() => setScreenCaptureAttempt(false)}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
