// COURSE
export interface Course {
    id: string;
    title: string;
    code: string;
    description?: string;
    status: 'active' | 'completed' | 'dropped';
    semester: string;
    startDate?: Date;
    endDate?: Date;
    instructor?: string;
    credits?: number;
    color?: string;
    grade?: string;
}

// ASSIGNMENT
export interface Assignment {
    id: string;
    title: string;
    courseId: string;
    courseName: string;
    description?: string;
    assignmentStatus: 'pending' | 'submitted' | 'graded';
    type: 'exam' | 'practice' | 'assignment';
    priority: 'low' | 'medium' | 'high';
    deadline: Date;
    repoUrl?: string;
    submittedAt?: Date;
    feedback?: string;
    attachments?: string[];
}

// PROJECT
export interface Project {
    id: string;
    title: string;
    description: string;
    courseId?: string;
    repoUrl?: string;
    deadline?: Date;
    projectStatus: 'planning' | 'designing' | 'coding' | 'done' | 'canceled';
    progress?: number;
    color: string;
    tags?: string[];
}

// NOTE
export interface Note {
    id: string;
    courseId?: string;
    courseName?: string;
    title: string;
    tags: string[];
    content: string;          // Markdown content
    filePath?: string;
    isPinned?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// CERTIFICATE
export interface Certificate {
    id: string;
    name: string;
    description: string;
    issuedBy: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialUrl?: string;
}

// HELPER
export type CourseStatus = 'active' | 'completed' | 'dropped';
export type AssignmentStatus = 'pending' | 'submitted' | 'graded';
export type AssignmentType = 'exam' | 'practice' | 'assignment';
export type AssignmentPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'planning' | 'designing' | 'coding' | 'done' | 'canceled';
