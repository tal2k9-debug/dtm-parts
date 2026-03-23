"use client";

const CONDITIONS = [
  { value: "יפה", emoji: "✨", label: "יפה" },
  { value: "שריטות", emoji: "📝", label: "שריטות" },
  { value: "סדק", emoji: "⚡", label: "סדק" },
  { value: "עיוות", emoji: "🔧", label: "עיוות" },
  { value: "שבור", emoji: "💥", label: "שבור" },
];

const COLORS = [
  "לבן", "שחור", "כסוף", "אפור", "כחול", "אדום",
  "ירוק", "צהוב", "חום", "כתום", "זהב", "אחר",
];

interface ConditionSelectProps {
  condition: string;
  color: string;
  price: string;
  notes: string;
  onChange: (data: { condition: string; color: string; price: string; notes: string }) => void;
}

export default function ConditionSelect({
  condition,
  color,
  price,
  notes,
  onChange,
}: ConditionSelectProps) {
  return (
    <div className="space-y-6">
      {/* Condition */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">מצב הפגוש</h3>
        <div className="grid grid-cols-5 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange({ condition: c.value, color, price, notes })}
              className={`py-4 rounded-xl text-center transition-all ${
                condition === c.value
                  ? "bg-blue-600 text-white border-2 border-blue-600 shadow-lg scale-105"
                  : "bg-white border-2 border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="text-2xl mb-1">{c.emoji}</div>
              <div className="text-xs font-medium">{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">צבע</h3>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ condition, color: c, price, notes })}
              className={`py-3 rounded-xl text-center font-medium transition-all text-sm ${
                color === c
                  ? "bg-blue-600 text-white border-2 border-blue-600"
                  : "bg-white border-2 border-gray-200 hover:border-blue-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">מחיר (אופציונלי)</h3>
        <div className="relative">
          <input
            type="number"
            placeholder="הזן מחיר"
            value={price}
            onChange={(e) => onChange({ condition, color, price: e.target.value, notes })}
            className="w-full p-4 border-2 rounded-xl text-center text-xl font-bold"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₪</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">הערות (אופציונלי)</h3>
        <textarea
          placeholder="הערות נוספות..."
          value={notes}
          onChange={(e) => onChange({ condition, color, price, notes: e.target.value })}
          rows={2}
          className="w-full p-3 border-2 rounded-xl resize-none"
        />
      </div>
    </div>
  );
}
