"use client";

import { useState, useCallback } from "react";
import CameraCapture from "@/components/scan/CameraCapture";
import AIIdentification from "@/components/scan/AIIdentification";
import VehicleSelect from "@/components/scan/VehicleSelect";
import ConditionSelect from "@/components/scan/ConditionSelect";
import ScanReview from "@/components/scan/ScanReview";

interface AIResult {
  identified: boolean;
  manufacturer?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  position?: "FRONT" | "REAR";
  confidence?: "high" | "medium" | "low";
}

export default function ScanPage() {
  // Steps: 0=camera, 1=vehicle, 2=condition, 3=review
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);

  // AI state
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showManualSelect, setShowManualSelect] = useState(false);

  // Vehicle details
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);
  const [position, setPosition] = useState<"FRONT" | "REAR" | null>(null);

  // Condition details
  const [condition, setCondition] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    itemNumber?: string;
    message?: string;
  } | null>(null);

  // Send first photo to AI
  const handleFirstPhoto = useCallback(async (photoBase64: string) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/scan/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: photoBase64 }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch {
      setAiResult({ identified: false });
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Accept AI identification
  const handleAIAccept = useCallback(() => {
    if (aiResult?.identified) {
      setMake(aiResult.manufacturer || "");
      setModel(aiResult.model || "");
      setYearFrom(aiResult.yearFrom || null);
      setYearTo(aiResult.yearTo || null);
      setPosition(aiResult.position || null);
      setStep(2); // Skip vehicle select, go to condition
    }
  }, [aiResult]);

  // Reject AI — show manual
  const handleAIReject = useCallback(() => {
    setShowManualSelect(true);
  }, []);

  // Upload to Monday
  const handleUpload = useCallback(async () => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/monday/create-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make,
          model,
          yearFrom,
          yearTo,
          position,
          condition,
          color,
          price: price ? parseFloat(price) : null,
          notes,
          photos,
        }),
      });
      const data = await res.json();
      setUploadResult(data);
    } catch {
      setUploadResult({ success: false, message: "שגיאה בהעלאה" });
    } finally {
      setIsUploading(false);
    }
  }, [make, model, yearFrom, yearTo, position, condition, color, price, notes, photos]);

  // Reset everything for new scan
  const handleReset = () => {
    setStep(0);
    setPhotos([]);
    setAiResult(null);
    setAiLoading(false);
    setShowManualSelect(false);
    setMake("");
    setModel("");
    setYearFrom(null);
    setYearTo(null);
    setPosition(null);
    setCondition("");
    setColor("");
    setPrice("");
    setNotes("");
    setUploadResult(null);
    setIsUploading(false);
  };

  // Step indicator
  const steps = ["צילום", "זיהוי", "מצב", "סיכום"];

  // Success screen
  if (uploadResult?.success) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-green-700">הפגוש נקלט בהצלחה!</h2>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <p className="text-4xl font-bold text-green-800">{uploadResult.itemNumber}</p>
          <p className="text-green-600 mt-2">מספר פריט ב-Monday</p>
        </div>
        <button
          onClick={handleReset}
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xl transition-colors"
        >
          קלוט פגוש נוסף
        </button>
      </div>
    );
  }

  // Error screen
  if (uploadResult && !uploadResult.success) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center space-y-6">
        <div className="text-6xl">❌</div>
        <h2 className="text-2xl font-bold text-red-700">שגיאה בהעלאה</h2>
        <p className="text-gray-600">{uploadResult.message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => { setUploadResult(null); handleUpload(); }}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold"
          >
            נסה שוב
          </button>
          <button
            onClick={() => setUploadResult(null)}
            className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold"
          >
            חזור לסיכום
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-center">קליטת פגוש</h1>

      {/* Step Indicator */}
      <div className="flex justify-center gap-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              i === step
                ? "bg-blue-600 text-white"
                : i < step
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < step ? "✓" : i + 1} {s}
          </div>
        ))}
      </div>

      {/* Step 0: Camera */}
      {step === 0 && (
        <div className="space-y-4">
          <CameraCapture
            photos={photos}
            onPhotosChange={setPhotos}
            onFirstPhotoReady={handleFirstPhoto}
          />
          {photos.length > 0 && (
            <button
              onClick={() => setStep(1)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors"
            >
              המשך ({photos.length} תמונות)
            </button>
          )}
          {aiLoading && (
            <p className="text-center text-blue-500 text-sm animate-pulse">
              מזהה רכב ברקע...
            </p>
          )}
        </div>
      )}

      {/* Step 1: AI Result + Vehicle Select */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Show AI result if available and not rejected */}
          {!showManualSelect && (aiLoading || aiResult) && (
            <AIIdentification
              aiResult={aiResult}
              isLoading={aiLoading}
              onAccept={handleAIAccept}
              onReject={handleAIReject}
            />
          )}

          {/* Show manual selection if: AI failed, rejected, or no result */}
          {(showManualSelect || (!aiLoading && (!aiResult || !aiResult.identified))) && (
            <VehicleSelect
              make={make}
              model={model}
              yearFrom={yearFrom}
              yearTo={yearTo}
              position={position}
              onChange={(data) => {
                setMake(data.make);
                setModel(data.model);
                setYearFrom(data.yearFrom);
                setYearTo(data.yearTo);
                setPosition(data.position);
              }}
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
            >
              חזרה
            </button>
            {make && model && position && (
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
              >
                המשך
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Condition & Price */}
      {step === 2 && (
        <div className="space-y-4">
          <ConditionSelect
            condition={condition}
            color={color}
            price={price}
            notes={notes}
            onChange={(data) => {
              setCondition(data.condition);
              setColor(data.color);
              setPrice(data.price);
              setNotes(data.notes);
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
            >
              חזרה
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              המשך לסיכום
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Upload */}
      {step === 3 && (
        <div className="space-y-4">
          <ScanReview
            photos={photos}
            make={make}
            model={model}
            yearFrom={yearFrom}
            yearTo={yearTo}
            position={position}
            condition={condition}
            color={color}
            price={price}
            notes={notes}
            isUploading={isUploading}
            onUpload={handleUpload}
            onEdit={(s) => setStep(s)}
          />
          {!isUploading && (
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
            >
              חזרה
            </button>
          )}
        </div>
      )}
    </div>
  );
}
