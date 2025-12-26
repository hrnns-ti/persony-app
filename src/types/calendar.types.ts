// Calendar Events interface
export interface CalendarEvent {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    category?: string;
    description?: string;
}

// Task interface
export interface Task {
    id: string;
    title: string;
    deadline: Date;
    status: 'pending' | 'completed';
    remaining?: string;
}
