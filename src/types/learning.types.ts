// Course
export interface Course {
    id: string;
    title: string;
    code?: string;
    semester?: string;
    description?: string;
    status: 'active' | 'completed' | 'dropped';
    startDate: Date;
    endDate?: Date;
}

// Assignment
export interface Assignment {
    id: string;
    title: string;
    courseId: string;
    courseName: string;
    description?: string;
    status: 'pending' | 'submitted';
    priority: 'low' | 'medium' | 'high';
    attachments: string[];
    deadline: Date;
}

// Notes
export interface Note {
    id: string;
    courseId?: string;
    courseName?: string;
    title: string;
    content: string;                 // Markdown content
    filePath?: string;               // Path to .md file (stored in Tauri)
    tags?: string[];
    isPinned?: boolean;
    createdDate: Date;
    lastModified: Date;
}

// Certification
export interface Certification {
    id: string;
    name: string;
    issuedBy: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
    credentialUrl?: string;
    filePath?: string;
    description?: string;
    skills?: string[];
}


// Helper
export type AssignmentStatus = 'pending' | 'submitted' | 'graded';
export type AssignmentPriority = 'low' | 'medium' | 'high';
export type CourseStatus = 'active' | 'completed' | 'dropped';