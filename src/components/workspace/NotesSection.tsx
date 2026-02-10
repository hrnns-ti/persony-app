import {useEffect, useMemo, useState} from "react";
import Modal from "../ui/Modal.tsx";
import { useNotes } from "../../hooks/workspace/useNotes.ts";

export default function NotesSection() {
    const { notes, loading, error, addNote, updateNote, removeNote } = useNotes();
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

    const selectedNote = useMemo(
        () => notes.find((n) => n.id === selectedNoteId) ?? null,
        [notes, selectedNoteId]
    );

    useEffect(() => {
        if (selectedNoteId && !selectedNote) setSelectedNoteId(null);
    }, [selectedNoteId, selectedNote]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="bg-main border border-line rounded-lg p-4 flex flex-col h-[100%]">

        </div>
    );
}