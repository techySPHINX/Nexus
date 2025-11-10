import { CheckCircle2, Circle } from 'lucide-react';

const items = [
  { label: 'Profile Photo', completed: true },
  { label: 'Bio & Experience', completed: true },
  { label: 'Skills', completed: true },
  { label: 'Certifications', completed: false },
  { label: 'Social Links', completed: false },
];

export default function ProfileStrength() {
  const completed = items.filter((item) => item.completed).length;
  const percentage = (completed / items.length) * 100;

  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Strength</h3>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {percentage}% Complete
          </span>
          <span className="text-xs text-emerald-600 font-semibold">
            {completed}/{items.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${item.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
        Complete Profile
      </button>
    </div>
  );
}
