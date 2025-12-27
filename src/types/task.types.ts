// Task
export interface Task {
    id: string;
    title: string;
    description?: string;
    deadline: Date;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    relatedCourseId?: string;     // link to Course if academic
    relatedCalendarEventId?: string; // link to CalendarEvent
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
