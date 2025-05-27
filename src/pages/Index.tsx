
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Image, File, X, Eye, Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentViewer } from '@/components/DocumentViewer';
import { SecurityLayer } from '@/components/SecurityLayer';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  url: string;
  progress: number;
}

const Index = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const id = Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);
      
      const uploadedFile: UploadedFile = {
        id,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        url,
        progress: 0
      };
      
      newFiles.push(uploadedFile);
    }

    // Simulate upload progress
    for (const file of newFiles) {
      setFiles(prev => [...prev.filter(f => f.id !== file.id), file]);
      
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }
    }

    toast({
      title: "Files uploaded successfully",
      description: `${newFiles.length} file(s) ready for secure viewing`,
    });
  }, [toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const processFiles = () => {
    if (files.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload files first",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsFullscreen(true);
    }, 1500);
  };

  if (isFullscreen) {
    return (
      <SecurityLayer>
        <DocumentViewer
          files={files}
          currentIndex={currentFileIndex}
          onClose={() => setIsFullscreen(false)}
          onFileChange={setCurrentFileIndex}
          darkMode={darkMode}
        />
      </SecurityLayer>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-all duration-500",
      darkMode 
        ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
        : "bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50"
    )}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className={cn(
                "text-3xl font-bold",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                SecureViewer Pro
              </h1>
              <p className={cn(
                "text-sm",
                darkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Ultra-secure document processing with advanced protection
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 hover:scale-105",
              darkMode 
                ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" 
                : "bg-white text-gray-600 hover:bg-gray-50 shadow-lg"
            )}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Upload Zone */}
        <div
          ref={dropZoneRef}
          className={cn(
            "relative p-8 border-2 border-dashed rounded-2xl transition-all duration-300 mb-8",
            "backdrop-blur-lg bg-opacity-30",
            dragActive
              ? darkMode
                ? "border-purple-400 bg-purple-500/20 scale-105"
                : "border-blue-400 bg-blue-500/20 scale-105"
              : darkMode
                ? "border-slate-600 bg-slate-800/30 hover:border-slate-500"
                : "border-gray-300 bg-white/50 hover:border-gray-400",
            "cursor-pointer group"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept="*/*"
          />
          
          <div className="text-center">
            <div className={cn(
              "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
              "group-hover:scale-110",
              dragActive
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                : darkMode
                  ? "bg-slate-700 text-slate-300"
                  : "bg-gray-100 text-gray-600"
            )}>
              <Upload className="h-10 w-10" />
            </div>
            
            <h3 className={cn(
              "text-xl font-semibold mb-2",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              {dragActive ? "Drop files here" : "Drag & drop files"}
            </h3>
            
            <p className={cn(
              "text-sm mb-4",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              or click to browse • All file types supported
            </p>
            
            <div className="flex justify-center space-x-4 text-xs">
              {['PDF', 'DOC', 'DOCX', 'TXT', 'Images'].map((type) => (
                <span
                  key={type}
                  className={cn(
                    "px-3 py-1 rounded-full",
                    darkMode ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-700"
                  )}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className={cn(
            "rounded-2xl p-6 mb-8 backdrop-blur-lg",
            darkMode ? "bg-slate-800/50" : "bg-white/50"
          )}>
            <h3 className={cn(
              "text-lg font-semibold mb-4 flex items-center",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              <FileText className="h-5 w-5 mr-2" />
              Uploaded Files ({files.length})
            </h3>
            
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                    darkMode ? "bg-slate-700/50 hover:bg-slate-700" : "bg-white/70 hover:bg-white"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      darkMode ? "bg-slate-600 text-slate-300" : "bg-gray-100 text-gray-600"
                    )}>
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium truncate max-w-xs",
                        darkMode ? "text-white" : "text-gray-900"
                      )}>
                        {file.name}
                      </p>
                      <p className={cn(
                        "text-sm",
                        darkMode ? "text-gray-400" : "text-gray-600"
                      )}>
                        {file.size}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className={cn(
                        "p-1 rounded-full transition-colors",
                        darkMode ? "hover:bg-slate-600 text-slate-400" : "hover:bg-gray-200 text-gray-500"
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="text-center">
          <button
            onClick={processFiles}
            disabled={files.length === 0 || isProcessing}
            className={cn(
              "px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300",
              "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:scale-105 hover:shadow-xl",
              "flex items-center space-x-2 mx-auto"
            )}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                <span>Process Files</span>
                <Lock className="h-4 w-4" />
              </>
            )}
          </button>
          
          {files.length === 0 && (
            <p className={cn(
              "mt-2 text-sm",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Upload files to enable secure processing
            </p>
          )}
        </div>

        {/* Security Features Info */}
        <div className={cn(
          "mt-12 p-6 rounded-2xl backdrop-blur-lg",
          darkMode ? "bg-slate-800/30" : "bg-white/30"
        )}>
          <h3 className={cn(
            "text-lg font-semibold mb-4 flex items-center",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            <Shield className="h-5 w-5 mr-2" />
            Advanced Security Features
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Screenshot Prevention",
              "Copy/Paste Blocking",
              "Right-click Disabled",
              "Developer Tools Block",
              "Download Prevention",
              "Session Watermarks",
              "Screen Recording Detection",
              "Content Encryption"
            ].map((feature) => (
              <div
                key={feature}
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg",
                  darkMode ? "bg-slate-700/50" : "bg-white/50"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className={cn(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
