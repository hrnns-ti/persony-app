// src/types/calendar.ts

export type CalendarView = "day" | "week" | "month" | "agenda" | "year";

export type CalendarVisibility = "default" | "public" | "private";
export type EventStatus = "confirmed" | "tentative" | "cancelled";

export type ReminderMethod = "popup" | "email";
export type RSVPStatus = "needsAction" | "accepted" | "declined" | "tentative";

export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurrenceRule {
    freq: RecurrenceFrequency;
    interval?: number;              // default 1
    byWeekday?: Weekday[];          // untuk weekly
    byMonthday?: number[];          // untuk monthly by date (1..31)
    byMonth?: number[];             // 1..12 (optional advanced)
    count?: number;                 // stop after n occurrences
    until?: string;                 // ISO datetime (or date), inclusive stop
    wkst?: Weekday;                 // week start (optional)
}

export interface Reminder {
    method: ReminderMethod;
    minutesBefore: number;          // e.g. 10, 30, 60, 1440
}

export interface Attendee {
    id?: string;
    name?: string;
    email: string;
    rsvpStatus: RSVPStatus;
    optional?: boolean;
    organizer?: boolean;
}

export interface Calendar {
    id: string;
    title: string;                  // e.g. "Personal", "Work"
    color?: string;                 // hex
    visibility?: CalendarVisibility;
    isPrimary?: boolean;
    createdAt: string;              // ISO
    updatedAt: string;              // ISO
}

export interface CalendarEvent {
    id: string;
    calendarId: string;

    title: string;
    description?: string;
    location?: string;

    start: string;                  // ISO datetime
    end: string;                    // ISO datetime
    allDay: boolean;
    timezone?: string;              // e.g. "Asia/Jakarta"

    status: EventStatus;
    visibility?: CalendarVisibility;

    color?: string;                 // optional override event color
    reminders?: Reminder[];

    recurrence?: RecurrenceRule;    // if present => recurring series

    attendees?: Attendee[];
    meetingUrl?: string;            // Google Meet/Zoom link
    createdAt: string;              // ISO
    updatedAt: string;              // ISO
}

export interface RecurringEventException {
    id: string;
    eventId: string;                // master event id
    originalStart: string;          // ISO datetime of occurrence
    cancelled?: boolean;
    override?: Partial<Omit<CalendarEvent, "id" | "calendarId" | "recurrence" | "createdAt" | "updatedAt">>;
    createdAt: string;
    updatedAt: string;
}

export interface EventInstance {
    instanceId: string;             // `${eventId}_${originalStart}`
    eventId: string;
    calendarId: string;

    title: string;
    description?: string;
    location?: string;

    start: string;
    end: string;
    allDay: boolean;
    timezone?: string;

    status: EventStatus;
    color?: string;

    isRecurring: boolean;
    originalStart?: string;         // if recurring
}