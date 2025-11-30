export type EventCategory =
  | 'GENERAL'
  | 'TECH_TALK'
  | 'WORKSHOP'
  | 'NETWORKING'
  | 'COMMUNITY';

export type EventStatus = 'UPCOMING' | 'PAST' | 'CANCELLED';

export type Event = {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO
  location?: string | null;
  imageUrl?: string | null;
  registrationLink?: string | null;
  category?: EventCategory;
  status?: EventStatus;
  tags?: string[];
  authorId?: string;
};
