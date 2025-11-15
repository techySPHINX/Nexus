// import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@mui/material/Card';
import { ArrowRight } from 'lucide-react';

// const events = [
//   {
//     id: 1,
//     title: 'Spring Networking',
//     date: 'Mar 15',
//     time: '6:00 PM',
//     location: 'Virtual',
//     attendees: 234,
//   },
//   {
//     id: 2,
//     title: 'Career Workshop',
//     date: 'Mar 22',
//     time: '2:00 PM',
//     location: 'Campus',
//     attendees: 156,
//   },
//   {
//     id: 3,
//     title: 'Alumni Mixer',
//     date: 'Apr 5',
//     time: '7:00 PM',
//     location: 'Downtown',
//     attendees: 89,
//   },
// ];

export default function UpcomingEvents() {
  const { isDark } = useTheme();

  const containerClasses = isDark
    ? 'rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow bg-neutral-900 border-neutral-700 text-emerald-100'
    : 'bg-white rounded-xl border border-emerald-100 p-6 shadow-sm';

  // const eventCardClass = isDark
  //   ? 'p-3 rounded-lg border border-neutral-700 hover:border-emerald-500 hover:bg-neutral-800 transition-all cursor-pointer group'
  //   : 'p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group';

  // const eventTitleClass = isDark
  //   ? 'font-semibold text-emerald-100 text-sm mb-2 group-hover:text-emerald-300 transition-colors'
  //   : 'font-semibold text-gray-900 text-sm mb-2 group-hover:text-emerald-600 transition-colors';

  // const eventInfoClass = isDark
  //   ? 'text-xs text-neutral-300'
  //   : 'text-xs text-gray-600';
  // const attendeesClass = isDark
  //   ? 'text-xs text-emerald-200 mt-2'
  //   : 'text-xs text-emerald-600 mt-2';

  return (
    <Card className={containerClasses}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className={
            isDark
              ? 'text-lg font-bold text-neutral-100'
              : 'text-lg font-bold text-gray-900'
          }
        >
          Upcoming Events
        </h3>
        <button
          className={
            isDark
              ? 'text-sky-600 hover:text-sky-700 transition-colors'
              : 'text-emerald-600 hover:text-emerald-700 transition-colors'
          }
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      Not Available
      {/* <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className={eventCardClass}>
            <h4 className={eventTitleClass}>{event.title}</h4>
            <div className="space-y-1">
              <div className={`flex items-center gap-2 ${eventInfoClass}`}>
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {event.date} • {event.time}
                </span>
              </div>
              <div className={`flex items-center gap-2 ${eventInfoClass}`}>
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{event.location}</span>
              </div>
            </div>
            <p className={attendeesClass}>{event.attendees} attending</p>
          </div>
        ))}
      </div> */}
    </Card>
  );
}
