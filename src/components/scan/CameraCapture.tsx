"use client";

import { useState, useRef, useCallback } from "react";

interface CameraCaptureProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onFirstPhotoReady: (photoBase64: string) => void;
  maxPhotos?: number;
}

// Compress image in browser using canvas
async function compressImage(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/webp", quality);
      if (compressed.startsWith("data:image/webp")) {
        resolve(compressed);
      } else {
        resolve(canvas.toDataURL("image/jpeg", quality));
      }
    };
    img.src = dataUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function CameraCapture({
  photos,
  onPhotosChange,
  onFirstPhotoReady,
  maxPhotos = 8,
}: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const firstPhotoSentRef = useRef(false);

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsProcessing(true);
      try {
        const file = files[0];
        const dataUrl = await fileToDataUrl(file);
        const compressed = await compressImage(dataUrl, 1200, 0.8);

        const newPhotos = [...photos, compressed];
        onPhotosChange(newPhotos);

        // Send first photo to AI
        if (!firstPhotoSentRef.current) {
          firstPhotoSentRef.current = true;
          onFirstPhotoReady(compressed);
        }
      } catch (err) {
        console.error("Photo processing error:", err);
      } finally {
        setIsProcessing(false);
        // Reset input so same file can be selected again
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [photos, onPhotosChange, onFirstPhotoReady]
  );

  const removePhoto = useCallback(
    (index: number) => {
      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
      if (newPhotos.length === 0) {
        firstPhotoSentRef.current = false;
      }
    },
    [photos, onPhotosChange]
  );

  const openCamera = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input — opens native camera */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {/* Camera Button */}
      <button
        onClick={openCamera}
        disabled={photos.length >= maxPhotos || isProcessing}
        className="w-full py-8 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors flex flex-col items-center gap-3 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-blue-600 font-medium">מעבד תמונה...</span>
          </>
        ) : (
          <>
            <svg
              className="w-14 h-14 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-blue-600 font-bold text-xl">
              {photos.length === 0 ? "צלם תמונה" : "צלם עוד"}
            </span>
            <span className="text-blue-400 text-sm">
              {photos.length}/{maxPhotos} תמונות
            </span>
          </>
        )}
      </button>

      {/* Photo Thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-md">
              <img
                src={photo}
                alt={`צילום ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow"
              >
                x
              </button>
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-xs text-center py-0.5">
                  ראשית
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
