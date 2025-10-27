'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface InputModeToggleProps {
  mode: 'text' | 'image';
  onModeChange: (mode: 'text' | 'image') => void;
  onImageUpload: (file: File) => void;
  onImageDescription: (description: string) => void;
  isGenerating: boolean;
}

export default function InputModeToggle({ 
  mode, 
  onModeChange, 
  onImageUpload, 
  onImageDescription,
  isGenerating 
}: InputModeToggleProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image file must be smaller than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Send image for description
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/describe-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to describe image');
      }

      console.log("🖼️ Image described as:", data.description);
      
      // Pass the description to parent
      onImageDescription(data.description);
      onImageUpload(file);
      
    } catch (error) {
      console.error('Error describing image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleModeToggle = (newMode: 'text' | 'image') => {
    if (isGenerating || isUploading) return;
    onModeChange(newMode);
    setUploadError(null);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20">
          <div className="flex">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeToggle('text')}
              disabled={isGenerating || isUploading}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                mode === 'text'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              } ${isGenerating || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🎧 Text Prompt
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeToggle('image')}
              disabled={isGenerating || isUploading}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                mode === 'image'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              } ${isGenerating || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🖼️ Image Prompt
            </motion.button>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      {mode === 'image' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-center">
            <p className="text-white text-lg mb-4">
              Upload an image to generate music inspired by its mood and atmosphere
            </p>
            
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isGenerating || isUploading}
                className="hidden"
              />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || isUploading}
                className={`w-full py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-200 border-2 border-dashed ${
                  isGenerating || isUploading
                    ? 'bg-gray-500 cursor-not-allowed border-gray-500'
                    : 'bg-white/10 hover:bg-white/20 border-white/30 hover:border-white/50'
                } text-white`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing image...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>📸</span>
                    <span>Choose Image</span>
                  </div>
                )}
              </motion.button>
            </div>

            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm"
              >
                {uploadError}
              </motion.div>
            )}

            <p className="text-gray-400 text-sm mt-2">
              Supports JPG, PNG, GIF up to 10MB
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
