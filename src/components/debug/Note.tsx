// src/components/debug/NotesDebug.tsx
import { useState } from 'react';
import { useNotes } from '../../hooks/note.hook';
import { Note } from '../../types';

export default function NotesDebug() {
    const { notes, loading, addNote, updateNote, removeNote } = useNotes();

    const [title, setTitle] = useState('');
    const [courseName, setCourseName] = useState('');
    const [content, setContent] = useState('# New note\n\nWrite markdown here...');
    const [tagsInput, setTagsInput] = useState('');

    async function handleAdd() {
        if (!title.trim()) return;

        const tags = tagsInput
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        await addNote({
            title: title.trim(),
            courseId: courseName ? courseName.trim() : undefined, // you can change this later
            courseName: courseName || undefined,
            content,
            filePath: undefined,
            tags,
            isPinned: false,
            createdDate: new Date(),      // will be overridden in service if you kept that logic
            lastModified: new Date(),     // same as above
        } as Omit<Note, 'id'>); // cast only for debug; in real code tighten the type

        setTitle('');
        setCourseName('');
        setTagsInput('');
    }

    async function togglePinned(note: Note) {
        await updateNote(note.id, { isPinned: !note.isPinned });
    }

    if (loading) {
        return <div style={{ padding: 16 }}>Loading notes...</div>;
    }

    return (
        <div style={{ padding: 16, fontFamily: 'system-ui', fontSize: 14 }}>
    <h2>Notes Debug Panel</h2>

    {/* New note form */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600, marginBottom: 16 }}>
    <input
        type="text"
    placeholder="Note title"
    value={title}
    onChange={e => setTitle(e.target.value)}
    />

    <input
    type="text"
    placeholder="Course name (optional)"
    value={courseName}
    onChange={e => setCourseName(e.target.value)}
    />

    <input
    type="text"
    placeholder="Tags (comma separated: exam, midterm, formula)"
    value={tagsInput}
    onChange={e => setTagsInput(e.target.value)}
    />

    <textarea
    rows={8}
    placeholder="Markdown content"
    value={content}
    onChange={e => setContent(e.target.value)}
    style={{ fontFamily: 'monospace', fontSize: 13 }}
    />

    <button onClick={handleAdd}>Add Note</button>
    </div>

    {/* Notes list */}
    <div>
        <strong>Notes:</strong>
    <ul style={{ paddingLeft: 16 }}>
    {notes.map(n => (
        <li key={n.id} style={{ marginBottom: 8 }}>
        <div>
            <strong>{n.title}</strong>{' '}
        {n.isPinned && <span>(pinned)</span>}
        </div>
            {n.courseName && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                Course: {n.courseName}
                </div>
            )}
            {n.tags && n.tags.length > 0 && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                Tags:{' '}
                {n.tags.map(tag => (
                    <span key={tag} style={{ marginRight: 4 }}>
                #{tag}
                    </span>
                ))}
                </div>
            )}
            <div style={{ fontSize: 12, opacity: 0.6 }}>
            Last modified: {n.lastModified.toLocaleString()}
            </div>
            <div style={{ marginTop: 4 }}>
            <button onClick={() => togglePinned(n)}>Toggle Pin</button>
        <button
            onClick={() => removeNote(n.id)}
            style={{ marginLeft: 8 }}
        >
            Delete
            </button>
            </div>
            </li>
        ))}
        </ul>
        </div>
        </div>
    );
    }
