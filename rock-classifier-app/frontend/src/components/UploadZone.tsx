import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  onImageSelected, 
  isLoading = false 
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      onImageSelected(file);
    }
  }, [onImageSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024,
    disabled: isLoading
  });

  return (
    <div
      {...getRootProps()}
      className={`
        group relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
        ${isDragActive 
          ? 'border-amber-400 bg-amber-50/50' 
          : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50/30'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      {preview ? (
        <div className="p-4 flex flex-col items-center gap-3">
          <div className="relative w-full aspect-square max-h-48 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover" 
            />
            {!isLoading && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full">
                  Change photo
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate max-w-full">{fileName}</p>
        </div>
      ) : (
        <div className="p-8 sm:p-10 flex flex-col items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
            isDragActive ? 'bg-amber-100' : 'bg-gray-100 group-hover:bg-amber-100'
          }`}>
            <svg 
              className={`w-7 h-7 transition-colors ${isDragActive ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 16V4m0 0l-4 4m4-4l4 4M6 20h12" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {isDragActive ? 'Drop your image here' : 'Drop a rock photo or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — up to 5 MB</p>
          </div>
        </div>
      )}
    </div>
  );
};
