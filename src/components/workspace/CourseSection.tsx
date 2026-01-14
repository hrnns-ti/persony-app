// src/components/workspace/CoursesSection.tsx
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
        <div className="bg-main border border-line rounded-lg p-4 flex flex-col h-full">
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

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {loading && <p className="text-xs text-slate-500">Loading courses...</p>}

                {!loading && courses.length === 0 && (
                    <p className="text-xs text-slate-500">No courses yet. Add one to get started.</p>
                )}

                {!loading &&
                    courses.map((c) => (
                        <div
                            key={c.id}
                            className="group relative bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-xs flex flex-col gap-2 hover:bg-slate-850 transition-all cursor-pointer"
                            onClick={() => {
                                setEditing(c);
                                setIsOpen(true);
                            }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <p className="text-slate-100 text-sm font-semibold">
                                        {c.title}
                                    </p>
                                    {c.code && (
                                        <p className="text-slate-400 text-[11px] mt-1">
                                            {c.code} • {c.semester}
                                        </p>
                                    )}
                                    {c.description && (
                                        <p className="text-slate-500 text-[10px] line-clamp-2">
                                            {c.description}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className="h-3 w-10 rounded-full flex-shrink-0 mt-1"
                                    style={{ backgroundColor: c.color || '#6366f1' }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded-full border border-slate-700">
                  {c.status}
                </span>
                                {c.startDate && c.endDate && (
                                    <span>
                    {c.startDate.toLocaleDateString(undefined, {
                        month: 'short',
                    })}{' '}
                                        –{' '}
                                        {c.endDate.toLocaleDateString(undefined, {
                                            month: 'short',
                                        })}
                  </span>
                                )}
                            </div>
                        </div>
                    ))}
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

            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Delete Course"
            >
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
