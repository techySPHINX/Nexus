import { Calendar, MapPin, ArrowRight } from 'lucide-react';

const events = [
  {
    id: 1,
    title: 'Spring Networking',
    date: 'Mar 15',
    time: '6:00 PM',
    location: 'Virtual',
    attendees: 234,
  },
  {
    id: 2,
    title: 'Career Workshop',
    date: 'Mar 22',
    time: '2:00 PM',
    location: 'Campus',
    attendees: 156,
  },
  {
    id: 3,
    title: 'Alumni Mixer',
    date: 'Apr 5',
    time: '7:00 PM',
    location: 'Downtown',
    attendees: 89,
  },
];

export default function UpcomingEvents() {
  return (
    <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
        <button className="text-emerald-600 hover:text-emerald-700 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
          >
            <h4 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-emerald-600 transition-colors">
              {event.title}
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {event.date} • {event.time}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{event.location}</span>
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              {event.attendees} attending
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
