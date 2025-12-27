// One calendar (like "Haerunnas", "Tasks", "Birthdays")
export interface Calendar {
    id: string;
    name: string;                 // "Haerunnas", "Tasks", "College"
    color: string;                // "#4285F4", "#F4B400", etc.
    description?: string;
    isPrimary?: boolean;          // Main calendar
    isVisible: boolean;           // Toggle in sidebar
}

// One event (lecture, meeting, etc.)
export interface CalendarEvent {
    id: string;
    calendarId: string;           // Links to Calendar.id
    title: string;
    startDate: Date;
    endDate: Date;

    allDay?: boolean;
    location?: string;
    description?: string;

    // Visual overrides
    color?: string;               // Override calendar color
    isBusy?: boolean;             // Busy vs free

    // Recurrence (store rule as string, implement later)
    isRecurring?: boolean;
    recurringRule?: string;

    createdAt: Date;
    updatedAt: Date;
}

// View modes (for header buttons)
export type CalendarView = 'day' | 'week' | 'month' | 'year';

// UI state for navigation
export interface CalendarUIState {
    view: CalendarView;           // Current view
    currentDate: Date;            // Anchor date (controls which day/week/month/year)
}

// Optional filter type
export interface CalendarFilter {
    from: Date;
    to: Date;
    calendarIds?: string[];
}