import { useCallback, useEffect, useRef, useState } from "react";
import type { Certificate } from "../../types/workspace";
import certificateService from "../../services/workspace.service/certificate";

function sortCertificates(items: Certificate[]) {
    return [...items].sort((a, b) => {
        const ad = new Date(a.issueDate).getTime();
        const bd = new Date(b.issueDate).getTime();
        return bd - ad;
    });
}

export function useCertificates() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await certificateService.getAll();
            if (!mountedRef.current) return;
            setCertificates(sortCertificates(data));
        } catch (e) {
            console.error(e);
            if (!mountedRef.current) return;
            setError(e instanceof Error ? e.message : "Failed to load certificates");
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const addCertificate = useCallback(async (input: Omit<Certificate, "id">) => {
        try {
            setError(null);
            const created = await certificateService.add(input);
            setCertificates((prev) => sortCertificates([created, ...prev]));
            return created;
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to add certificate");
            throw e;
        }
    }, []);

    const updateCertificate = useCallback(async (id: string, patch: Partial<Certificate>) => {
        try {
            setError(null);
            const updated = await certificateService.update(id, patch);
            if (!updated) return null;
            setCertificates((prev) => sortCertificates(prev.map((c) => (c.id === id ? updated : c))));
            return updated;
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to update certificate");
            throw e;
        }
    }, []);

    const removeCertificate = useCallback(async (id: string) => {
        try {
            setError(null);
            await certificateService.remove(id);
            setCertificates((prev) => prev.filter((c) => c.id !== id));
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to delete certificate");
            throw e;
        }
    }, []);

    // optional: kalau service kamu punya attachPdf(id, sourcePath)
    const attachPdfToCertificate = useCallback(async (id: string, sourcePdfPath: string) => {
        try {
            setError(null);
            const updated = await certificateService.attachPdf?.(id, sourcePdfPath);
            if (!updated) return null;
            setCertificates((prev) => sortCertificates(prev.map((c) => (c.id === id ? updated : c))));
            return updated;
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to attach PDF");
            throw e;
        }
    }, []);

    return {
        certificates,
        loading,
        error,
        refresh: load,
        addCertificate,
        updateCertificate,
        removeCertificate,
        attachPdfToCertificate,
    };
}
