import { useState } from 'react';
import { useCourses, useAssignments } from '../../hooks/learning.hook';

export default function LearningDebug() {
    const { courses, loading: loadingCourses, addCourse, completeCourse } =
        useCourses();

    const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>();
    const {
        assignments,
        loading: loadingAssignments,
        addAssignment,
        submitAssignment,
    } = useAssignments(selectedCourseId);

    const [courseTitle, setCourseTitle] = useState('');
    const [courseCode, setCourseCode] = useState('');

    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentPriority, setAssignmentPriority] =
        useState<'low' | 'medium' | 'high'>('medium');

    async function handleAddCourse() {
        if (!courseTitle) return;

        const today = new Date();

        await addCourse({
            title: courseTitle,
            code: courseCode || undefined,
            semester: '2025',
            description: '',
            status: 'active',
            startDate: today,
        });

        setCourseTitle('');
        setCourseCode('');
    }

    async function handleAddAssignment() {
        if (!selectedCourseId || !assignmentTitle) return;
        const course = courses.find(c => c.id === selectedCourseId);
        if (!course) return;

        await addAssignment({
            title: assignmentTitle,
            courseId: course.id,
            courseName: course.title,
            description: '',
            status: 'pending',
            priority: assignmentPriority,
            attachments: [],
            deadline: new Date(),
        });

        setAssignmentTitle('');
    }

    if (loadingCourses) {
        return <div style={{ padding: 16 }}>Loading learning data...</div>;
    }

    return (
        <div style={{ padding: 16, fontFamily: 'system-ui', fontSize: 14 }}>
            <h2>Learning Debug Panel</h2>

            {/* Add Course */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <input
                    type="text"
                    placeholder="Course title"
                    value={courseTitle}
                    onChange={e => setCourseTitle(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Code"
                    value={courseCode}
                    onChange={e => setCourseCode(e.target.value)}
                />
                <button onClick={handleAddCourse}>Add Course</button>
            </div>

            {/* Course List */}
            <div style={{ marginBottom: 16 }}>
                <strong>Courses:</strong>
                <ul>
                    {courses.map(c => (
                        <li key={c.id}>
                            <button
                                style={{
                                    marginRight: 8,
                                    fontWeight: c.id === selectedCourseId ? 'bold' : 'normal',
                                }}
                                onClick={() => setSelectedCourseId(c.id)}
                            >
                                {c.title} ({c.code || 'no-code'})
                            </button>
                            [{c.status}]
                            <button
                                onClick={() => completeCourse(c.id)}
                                style={{ marginLeft: 8 }}
                            >
                                Mark Completed
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Assignments for selected course */}
            {selectedCourseId && (
                <div>
                    <strong>Assignments for selected course:</strong>

                    <div style={{ margin: '8px 0', display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            placeholder="Assignment title"
                            value={assignmentTitle}
                            onChange={e => setAssignmentTitle(e.target.value)}
                        />
                        <select
                            value={assignmentPriority}
                            onChange={e =>
                                setAssignmentPriority(
                                    e.target.value as 'low' | 'medium' | 'high',
                                )
                            }
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <button onClick={handleAddAssignment}>Add Assignment</button>
                    </div>

                    {loadingAssignments ? (
                        <p>Loading assignments...</p>
                    ) : (
                        <ul>
                            {assignments.map(a => (
                                <li key={a.id}>
                                    {a.title} [{a.priority}] - {a.status} (deadline:{' '}
                                    {a.deadline.toLocaleString()})
                                    <button
                                        onClick={() => submitAssignment(a.id)}
                                        style={{ marginLeft: 8 }}
                                    >
                                        Submit
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
