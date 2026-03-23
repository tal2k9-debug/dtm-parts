"use client";

interface AIResult {
  identified: boolean;
  manufacturer?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  position?: "FRONT" | "REAR";
  confidence?: "high" | "medium" | "low";
}

interface AIIdentificationProps {
  aiResult: AIResult | null;
  isLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export default function AIIdentification({
  aiResult,
  isLoading,
  onAccept,
  onReject,
}: AIIdentificationProps) {
  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-blue-700 font-medium">מזהה את הרכב...</p>
        <p className="text-blue-500 text-sm mt-1">זה לוקח כמה שניות</p>
      </div>
    );
  }

  if (!aiResult || !aiResult.identified) {
    return null; // Will show manual selection
  }

  const confidenceText =
    aiResult.confidence === "high"
      ? "ביטחון גבוה"
      : aiResult.confidence === "medium"
      ? "ביטחון בינוני"
      : "ביטחון נמוך";

  const confidenceColor =
    aiResult.confidence === "high"
      ? "text-green-600"
      : aiResult.confidence === "medium"
      ? "text-yellow-600"
      : "text-red-500";

  const yearText =
    aiResult.yearFrom === aiResult.yearTo
      ? `${aiResult.yearFrom}`
      : `${aiResult.yearFrom}-${aiResult.yearTo}`;

  const positionText = aiResult.position === "FRONT" ? "קדמי" : "אחורי";

  return (
    <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 space-y-4">
      <div className="text-center">
        <p className="text-green-800 font-bold text-xl mb-1">זיהינו את הרכב!</p>
        <p className={`text-sm ${confidenceColor}`}>{confidenceText}</p>
      </div>

      <div className="bg-white rounded-xl p-4 text-center space-y-2">
        <p className="text-2xl font-bold text-gray-800">
          {aiResult.manufacturer} {aiResult.model}
        </p>
        <p className="text-lg text-gray-600">
          {yearText} | {positionText}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors"
        >
          נכון
        </button>
        <button
          onClick={onReject}
          className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-lg transition-colors"
        >
          לא נכון
        </button>
      </div>
    </div>
  );
}
