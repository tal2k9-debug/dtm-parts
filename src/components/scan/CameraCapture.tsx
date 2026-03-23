"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  photos: string[]; // base64 data URLs
  onPhotosChange: (photos: string[]) => void;
  onFirstPhotoReady: (photoBase64: string) => void; // triggers AI identification
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

      // Try WebP first, fallback to JPEG
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

export default function CameraCapture({
  photos,
  onPhotosChange,
  onFirstPhotoReady,
  maxPhotos = 8,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstPhotoSentRef = useRef(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError("לא ניתן לפתוח את המצלמה. אנא אשר גישה למצלמה.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsCameraReady(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const compressed = await compressImage(rawDataUrl, 1200, 0.8);

    const newPhotos = [...photos, compressed];
    onPhotosChange(newPhotos);

    // Send first photo to AI
    if (!firstPhotoSentRef.current) {
      firstPhotoSentRef.current = true;
      onFirstPhotoReady(compressed);
    }

    // Close camera if max reached
    if (newPhotos.length >= maxPhotos) {
      stopCamera();
    }
  }, [photos, onPhotosChange, onFirstPhotoReady, maxPhotos, isCameraReady, stopCamera]);

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

  return (
    <div className="space-y-4">
      {/* Camera View */}
      {isCameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-[50vh] object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              disabled={photos.length >= maxPhotos}
              className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-90 transition-transform disabled:opacity-50"
              aria-label="צלם"
            >
              <div className="w-12 h-12 bg-white rounded-full mx-auto border-2 border-gray-400" />
            </button>
            <button
              onClick={stopCamera}
              className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-xl text-white"
              aria-label="סגור מצלמה"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {photos.length}/{maxPhotos}
          </div>
        </div>
      ) : (
        <button
          onClick={startCamera}
          disabled={photos.length >= maxPhotos}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center gap-3 disabled:opacity-50"
        >
          <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-blue-600 font-medium text-lg">
            {photos.length === 0 ? "פתח מצלמה וצלם" : "צלם עוד"}
          </span>
        </button>
      )}

      {error && (
        <p className="text-red-500 text-center text-sm">{error}</p>
      )}

      {/* Photo Thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
              <img src={photo} alt={`צילום ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow"
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
