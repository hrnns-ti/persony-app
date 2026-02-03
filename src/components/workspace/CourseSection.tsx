import { useState } from 'react';
import { useCourses } from '../../hooks/workspace/useCourses';
import CourseForm from './CourseForm';
import Modal from '../ui/Modal';
import type { Course } from '../../types/workspace';

export default function CoursesSection() {
    const { courses, addCourse, updateCourse, removeCourse, loading } = useCourses();

    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);

    async function handleSubmit(data: Omit<Course, 'id'>) {
        if (editing) {
            await updateCourse(editing.id, data);
            setEditing(null);
        } else {
            await addCourse(data);
        }
        setIsOpen(false);
    }

    async function handleDelete() {
        if (!confirmDelete) return;
        await removeCourse(confirmDelete.id);
        setConfirmDelete(null);
    }

    return (
        <div className="bg-main border border-line rounded-md p-6 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <h2 className="mx-1 text-sm font-semibold text-slate-400">My Courses</h2>
                <button
                    onClick={() => {
                        setEditing(null);
                        setIsOpen(true);
                    }}
                    className="h-7 w-7 rounded-md flex items-center justify-center bg-main border border-line text-white text-sm hover:border-blue-400 hover:text-blue-400"
                >
                    +
                </button>
            </div>

            <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                <div className="w-full max-w-full h-full flex gap-3 overflow-x-auto savings-scroll">
                    {loading && (
                        <div className="flex items-center justify-center w-full h-32 text-xs text-slate-500">
                            Loading courses...
                        </div>
                    )}

                    {!loading && courses.length === 0 && (
                        <div className="flex items-center justify-center w-full h-32 text-xs text-slate-500">
                            No courses yet. Add one to get started.
                        </div>
                    )}

                    {!loading &&
                        courses.map((c) => (
                            <div
                                key={c.id}
                                className="group relative bg-slate-900 border border-slate-800 rounded-md w-44 h-32 flex flex-col p-3 hover:bg-slate-850 hover:scale-105 transition-all cursor-pointer shadow-sm hover:shadow-md flex-shrink-0"
                                onClick={() => {
                                    setEditing(c);
                                    setIsOpen(true);
                                }}
                            >
                                <div
                                    className="h-2 rounded-xl mb-2 flex-shrink-0"
                                    style={{ backgroundColor: c.color || '#6366f1' }}
                                />

                                <div className="flex-1 mb-2">
                                    <p className="text-slate-100 text-sm font-semibold line-clamp-2 mb-1">{c.title}</p>
                                    {c.code && <p className="text-slate-400 text-xs">{c.code} • {c.semester}</p>}
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-400 space-x-1">
                                    <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                                        {c.status}
                                    </span>

                                    {c.startDate && c.endDate && (
                                        <span className="text-slate-500 text-[10px] truncate">
                                            {c.startDate.toLocaleDateString(undefined, { month: 'short' })} –{' '}
                                            {c.endDate.toLocaleDateString(undefined, { month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <Modal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setEditing(null);
                }}
                title={editing ? 'Edit Course' : 'Add Course'}
            >
                <CourseForm
                    initial={editing ?? undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setIsOpen(false);
                        setEditing(null);
                    }}
                />
            </Modal>

            <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Course">
                <div className="space-y-4 text-sm text-slate-300">
                    <p>
                        Are you sure you want to delete{' '}
                        <span className="font-semibold">{confirmDelete?.title}</span>?
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 text-xs rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-500"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}