"use client";

interface ScanReviewProps {
  photos: string[];
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  position: "FRONT" | "REAR" | null;
  condition: string;
  color: string;
  price: string;
  notes: string;
  isUploading: boolean;
  onUpload: () => void;
  onEdit: (step: number) => void;
}

export default function ScanReview({
  photos,
  make,
  model,
  yearFrom,
  yearTo,
  position,
  condition,
  color,
  price,
  notes,
  isUploading,
  onUpload,
  onEdit,
}: ScanReviewProps) {
  const yearText =
    yearFrom && yearTo
      ? yearFrom === yearTo
        ? `${yearFrom}`
        : `${yearFrom}-${yearTo}`
      : yearFrom
      ? `${yearFrom}+`
      : "";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center text-gray-800">סיכום לפני העלאה</h2>

      {/* Photos */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-600">תמונות ({photos.length})</span>
          <button onClick={() => onEdit(0)} className="text-blue-600 text-sm underline">
            ערוך
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p}
              alt={`צילום ${i + 1}`}
              className="w-full aspect-square object-cover rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-600">פרטי רכב</span>
          <button onClick={() => onEdit(1)} className="text-blue-600 text-sm underline">
            ערוך
          </button>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">
            {make} {model}
          </p>
          <p className="text-lg text-gray-600">
            {yearText} | {position === "FRONT" ? "קדמי" : "אחורי"}
          </p>
        </div>
      </div>

      {/* Condition & Price */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-600">מצב ומחיר</span>
          <button onClick={() => onEdit(2)} className="text-blue-600 text-sm underline">
            ערוך
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">מצב</p>
            <p className="font-bold">{condition || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">צבע</p>
            <p className="font-bold">{color || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">מחיר</p>
            <p className="font-bold">{price ? `${price} ₪` : "—"}</p>
          </div>
        </div>
        {notes && (
          <p className="mt-2 text-sm text-gray-500 text-center">הערות: {notes}</p>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={onUpload}
        disabled={isUploading}
        className="w-full py-5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-2xl font-bold text-xl transition-colors shadow-lg"
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            מעלה ל-Monday...
          </span>
        ) : (
          "העלה ל-Monday"
        )}
      </button>
    </div>
  );
}
