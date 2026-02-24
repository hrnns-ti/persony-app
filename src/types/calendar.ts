// src/types/calendar.ts

/** ISO string helpers (kita pakai string biasa supaya fleksibel di runtime) */
export type ISODateString = string;      // e.g. "2026-02-24"
export type ISODateTimeString = string;  // e.g. "2026-02-24T10:00:00.000Z"
export type ISOString = string;

export type CalendarView = "day" | "week" | "month" | "agenda" | "year";

export type CalendarVisibility = "default" | "public" | "private";
export type EventStatus = "confirmed" | "tentative" | "cancelled";

/** Google-like: apakah event ngisi waktu (busy) atau hanya info (free) */
export type EventTransparency = "opaque" | "transparent";

export type ReminderMethod = "popup" | "email";
export type RSVPStatus = "needsAction" | "accepted" | "declined" | "tentative";

export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurrenceRule {
    freq: RecurrenceFrequency;
    interval?: number;         // default 1
    byWeekday?: Weekday[];     // untuk weekly
    byMonthday?: number[];     // untuk monthly by date (1..31)
    byMonth?: number[];        // 1..12 (optional)
    count?: number;            // stop after n occurrences
    until?: ISODateTimeString; // ISO datetime (inclusive stop)
    wkst?: Weekday;            // week start (optional)
}

export interface Reminder {
    method: ReminderMethod;
    minutesBefore: number;     // e.g. 10, 30, 60, 1440
}

export interface Attendee {
    id?: string;
    name?: string;
    email: string;
    rsvpStatus: RSVPStatus;
    optional?: boolean;
    organizer?: boolean;
}

/** Calendar list entity (Personal/Work/etc) */
export interface Calendar {
    id: string;
    title: string;                 // e.g. "Personal", "Work"
    color?: string;                // hex
    visibility?: CalendarVisibility;
    isPrimary?: boolean;
    createdAt: ISOString;          // ISO
    updatedAt: ISOString;          // ISO
}

/** Master event (series kalau recurring) */
export interface CalendarEvent {
    id: string;
    calendarId: string;

    title: string;
    description?: string;
    location?: string;

    start: ISODateTimeString;
    end: ISODateTimeString;
    allDay: boolean;
    timezone?: string;             // e.g. "Asia/Jakarta"

    status: EventStatus;
    visibility?: CalendarVisibility;
    transparency?: EventTransparency; // busy/free

    color?: string;                // optional override event color
    reminders?: Reminder[];

    /** kalau ada => recurring series */
    recurrence?: RecurrenceRule;

    attendees?: Attendee[];
    meetingUrl?: string;           // Google Meet/Zoom link

    createdAt: ISOString;
    updatedAt: ISOString;
}

export interface RecurringEventException {
    id: string;
    eventId: string;               // master event id
    originalStart: ISODateTimeString; // ISO datetime of occurrence start
    cancelled?: boolean;

    override?: Partial<
        Omit<
            CalendarEvent,
            "id" | "calendarId" | "recurrence" | "createdAt" | "updatedAt"
        >
    >;

    createdAt: ISOString;
    updatedAt: ISOString;
}

export interface EventInstance {
    instanceId: string;
    eventId: string;
    calendarId: string;

    title: string;
    description?: string;
    location?: string;

    start: ISODateTimeString;
    end: ISODateTimeString;
    allDay: boolean;
    timezone?: string;

    status: EventStatus;
    visibility?: CalendarVisibility;
    transparency?: EventTransparency;

    color?: string;

    isRecurring: boolean;
    originalStart?: ISODateTimeString; // if recurring
}

/** Convenience: input types for service/hook */
export type CalendarCreateInput = Omit<Calendar, "id" | "createdAt" | "updatedAt">;
export type CalendarUpdatePatch = Partial<Omit<Calendar, "id" | "createdAt" | "updatedAt">>;

export type EventCreateInput = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;
export type EventUpdatePatch = Partial<Omit<CalendarEvent, "id" | "calendarId" | "createdAt" | "updatedAt">>;

export type ExceptionCreateInput = Omit<RecurringEventException, "id" | "createdAt" | "updatedAt">;
export type ExceptionUpdatePatch = Partial<Omit<RecurringEventException, "id" | "eventId" | "createdAt" | "updatedAt">>;