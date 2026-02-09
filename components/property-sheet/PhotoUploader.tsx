'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

interface PhotoUploaderProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploader({ 
  photos, 
  onChange, 
  maxPhotos = 20 
}: PhotoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    try {
      const newPhotos: Photo[] = [];
      
      for (const file of filesToProcess) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);
        
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random()}`,
          url: base64,
          caption: '',
          order: photos.length + newPhotos.length,
        });
      }

      onChange([...photos, ...newPhotos]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload some photos. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [photos, onChange, maxPhotos]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removePhoto = (photoId: string) => {
    const updated = photos
      .filter(p => p.id !== photoId)
      .map((p, index) => ({ ...p, order: index }));
    onChange(updated);
  };

  const updateCaption = (photoId: string, caption: string) => {
    const updated = photos.map(p => 
      p.id === photoId ? { ...p, caption } : p
    );
    onChange(updated);
  };

  const movePhoto = (photoId: string, direction: 'up' | 'down') => {
    const index = photos.findIndex(p => p.id === photoId);
    if (index === -1) return;

    const newPhotos = [...photos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= photos.length) return;

    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
    
    const reordered = newPhotos.map((p, i) => ({ ...p, order: i }));
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        `}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          disabled={uploading || photos.length >= maxPhotos}
          className="hidden"
        />
        <label 
          htmlFor="photo-upload" 
          className={`cursor-pointer ${photos.length >= maxPhotos ? 'cursor-not-allowed' : ''}`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-lg font-medium text-gray-700 mb-1">
            {uploading ? 'Uploading...' : 'Drop photos here or click to browse'}
          </p>
          <p className="text-sm text-gray-500">
            {photos.length} / {maxPhotos} photos • Max 5MB each • JPG, PNG, WebP
          </p>
        </label>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">
            Uploaded Photos ({photos.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative border rounded-lg overflow-hidden bg-white"
              >
                {/* Photo Preview */}
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Cover Photo
                    </div>
                  )}
                </div>

                {/* Photo Controls */}
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Add caption (optional)"
                    value={photo.caption || ''}
                    onChange={(e) => updateCaption(photo.id, e.target.value)}
                    className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => movePhoto(photo.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => movePhoto(photo.id, 'down')}
                        disabled={index === photos.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePhoto(photo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No photos uploaded yet</p>
          <p className="text-sm">Add at least 1 photo to continue</p>
        </div>
      )}
    </div>
  );
}








