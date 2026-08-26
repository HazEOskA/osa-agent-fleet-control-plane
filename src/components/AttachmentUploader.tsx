import React, { useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import type { AttachedImage } from '../types';

interface AttachmentUploaderProps {
  images: AttachedImage[];
  onAddImages: (newImages: AttachedImage[]) => void;
  onRemoveImage: (id: string) => void;
  disabled?: boolean;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  images,
  onAddImages,
  onRemoveImage,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const validImages: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        // Limit file size to 10MB
        if (file.size <= 10 * 1024 * 1024) {
          validImages.push(file);
        }
      }
    }

    if (validImages.length === 0) return;

    const promises = validImages.map((file) => {
      return new Promise<AttachedImage>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          resolve({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            mimeType: file.type,
            data: dataUrl,
            previewUrl: dataUrl,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((newAttached) => {
      onAddImages(newAttached);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Image Preview Strip */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 mb-2 bg-neutral-100/80 rounded-lg border border-neutral-200">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-md overflow-hidden border border-neutral-300 bg-white shadow-xs w-16 h-16"
            >
              <img
                src={img.previewUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                className="absolute top-0.5 right-0.5 bg-neutral-900/80 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-colors opacity-90 group-hover:opacity-100"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ImageAttachButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  count?: number;
}> = ({ onClick, disabled, count = 0 }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative p-2 rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed ${
        count > 0 ? 'text-blue-600 bg-blue-50' : ''
      }`}
      title="Attach images for vision analysis"
    >
      <ImageIcon className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </button>
  );
};
