import { useMemo, useState } from "react";
import Modal from "../ui/Modal";
import type { Certificate } from "../../types/workspace";
import { useCertificates } from "../../hooks/workspace/useCertificates";
import CertificateForm from "./CertificateForm";
import certificateService from "../../services/workspace.service/certificate";

function isExpired(c: Certificate) {
    if (!c.expiryDate) return false;
    const exp = c.expiryDate;
    if (Number.isNaN(exp.getTime())) return false;
    return exp.getTime() < new Date().getTime();
}

function fileNameFromPath(p: string) {
    return p.split(/[/\\]/).pop() ?? p;
}

export default function CertificatesSection() {
    const {
        certificates,
        loading,
        error,
        addCertificate,
        updateCertificate,
        removeCertificate,
        attachPdfToCertificate,
    } = useCertificates();

    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Certificate | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Certificate | null>(null);

    // untuk create mode: PDF dipilih dulu, attach setelah add selesai (butuh id)
    const [pendingPdfPath, setPendingPdfPath] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const sorted = useMemo(() => certificates, [certificates]);

    function closeForm() {
        setIsOpen(false);
        setEditing(null);
        setPendingPdfPath(null);
        setBusy(false);
    }

    function openCreate() {
        setEditing(null);
        setPendingPdfPath(null);
        setIsOpen(true);
    }

    function openEdit(c: Certificate) {
        setEditing(c);
        setPendingPdfPath(null);
        setIsOpen(true);
    }

    async function handlePickPdf() {
        try {
            const picked = await certificateService.pickPdfPath();
            if (!picked) return;

            if (editing) {
                if (!attachPdfToCertificate) return;
                setBusy(true);
                const updated = await attachPdfToCertificate(editing.id, picked);
                if (updated) setEditing(updated);
                setBusy(false);
                return;
            }

            // create mode: simpan dulu, attach setelah add success
            setPendingPdfPath(picked);
        } catch (e) {
            console.error(e);
            setBusy(false);
        }
    }

    async function handleSubmit(data: Omit<Certificate, "id">) {
        setBusy(true);
        try {
            if (editing) {
                // update cert
                const updated = await updateCertificate(editing.id, data);
                if (updated) setEditing(updated);

                closeForm();
                return;
            }

            // create cert
            const created = await addCertificate(data);

            // attach pdf setelah punya id
            if (pendingPdfPath && attachPdfToCertificate) {
                await attachPdfToCertificate(created.id, pendingPdfPath);
            }

            closeForm();
        } finally {
            setBusy(false);
        }
    }

    async function handleDeleteConfirmed() {
        if (!confirmDelete) return;
        await removeCertificate(confirmDelete.id);
        setConfirmDelete(null);
        if (editing?.id === confirmDelete.id) closeForm();
    }

    return (
        <div className="bg-main border border-line rounded-md p-4 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <h2 className="mx-1 text-sm font-semibold text-slate-400">
                    Certificates
                </h2>
                <button
                    onClick={openCreate}
                    className="h-7 w-7 rounded-md flex items-center justify-center bg-main border border-line text-white text-sm hover:border-blue-400 hover:text-blue-400"
                >
                    +
                </button>
            </div>

            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

            {/* LIST AREA */}
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                <div className="w-full h-full overflow-y-auto savings-scroll pr-1">
                    {loading && (
                        <div className="flex items-center justify-center w-full h-32 text-xs text-slate-500">
                            Loading certificates...
                        </div>
                    )}

                    {!loading && sorted.length === 0 && (
                        <div className="flex items-center justify-center w-full h-32 text-xs text-slate-500">
                            No certificates yet.
                        </div>
                    )}

                    {!loading && sorted.length > 0 && (
                        // Grid biar otomatis turun ke bawah (wrap)
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {sorted.map((c) => {
                                const expired = isExpired(c);
                                const issue = c.issueDate;
                                const exp = c.expiryDate ?? null;

                                return (
                                    <div
                                        key={c.id}
                                        className="group relative bg-main border border-line rounded-md flex flex-col p-3 hover:bg-slate-850 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                        onClick={() => openEdit(c)}
                                    >
                                        {/* PREVIEW */}
                                        {c.previewDataUrl ? (
                                            <img
                                                src={c.previewDataUrl}
                                                alt={`${c.name} preview`}
                                                className="w-full h-20 object-cover opacity-80 rounded-md border border-line mb-2"
                                            />
                                        ) : (
                                            <div className="w-full h-20 rounded-md border border-dashed border-line mb-2 flex items-center justify-center text-slate-500 text-xs">
                                                No PDF preview
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-slate-100 text-sm font-semibold truncate">
                                                    {c.name}
                                                </p>
                                                <p className="text-slate-400 text-xs truncate">
                                                    {c.issuedBy}
                                                </p>
                                            </div>

                                            {expired && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-700/60 text-red-300">
                          expired
                        </span>
                                            )}
                                        </div>

                                        <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span>Issued</span>
                                                <span className="tabular-nums">
                          {!Number.isNaN(issue.getTime())
                              ? issue.toLocaleDateString()
                              : "-"}
                        </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span>Expiry</span>
                                                <span className="tabular-nums">
                          {exp && !Number.isNaN(exp.getTime())
                              ? exp.toLocaleDateString()
                              : "—"}
                        </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                            <p className="text-slate-500 text-[11px] line-clamp-1">
                                                {c.description || " "}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                {c.credentialUrl && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-300">
                            url
                          </span>
                                                )}

                                                {/* OPEN PDF */}
                                                <button
                                                    type="button"
                                                    disabled={!c.filePath}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        certificateService.openPdf?.(c);
                                                    }}
                                                    className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 hover:border-slate-400 disabled:opacity-50"
                                                    title={c.filePath ? "Open PDF" : "No PDF attached"}
                                                >
                                                    pdf
                                                </button>
                                            </div>
                                        </div>

                                        {/* quick delete */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsOpen(false);
                                                setEditing(null);
                                                setPendingPdfPath(null);
                                                setConfirmDelete(c);
                                            }}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-main border border-line hover:border-red flex items-center justify-center text-slate-400 hover:text-red text-xs font-bold transition-all"
                                            title="Delete certificate"
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Add/Edit */}
            <Modal
                isOpen={isOpen}
                onClose={closeForm}
                title={editing ? "Edit Certificate" : "Add Certificate"}
            >
                <CertificateForm
                    initial={editing ?? undefined}
                    onSubmit={handleSubmit}
                    onCancel={closeForm}
                    onUploadPdf={handlePickPdf}
                    pendingPdfName={pendingPdfPath ? fileNameFromPath(pendingPdfPath) : null}
                    busy={busy}
                    onDelete={
                        editing
                            ? async () => {
                                closeForm();
                                setConfirmDelete(editing);
                            }
                            : undefined
                    }
                />
            </Modal>

            {/* Confirm delete */}
            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Delete Certificate"
            >
                <div className="space-y-4 text-sm text-slate-300">
                    <p>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold hover:text-red">{confirmDelete?.name}</span>?
                    </p>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 text-xs rounded-md border  border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteConfirmed}
                            className="px-4 py-1.5 text-xs border border-slate-600 rounded-md bg-red-600 hover:text-red text-slate-300 hover:border-red"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
