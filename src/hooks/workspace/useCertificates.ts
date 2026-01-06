import { useEffect, useState } from 'react';
import type { Certificate } from '../../types/workspace';
import certificateService from '../../services/workspace.service/certificate.ts';

export function useCertificates() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // initial load
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await certificateService.getAll();
                if (!mounted) return;
                setCertificates(data);
            } catch (err) {
                console.error('Failed to load certificates', err);
                if (!mounted) return;
                setError('Failed to load certificates');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    async function addCertificate(
        input: Omit<Certificate, 'id'>
    ): Promise<Certificate> {
        try {
            const created = await certificateService.add(input);
            setCertificates((prev) => [...prev, created]);
            return created;
        } catch (err) {
            console.error('Failed to add certificate', err);
            setError('Failed to add certificate');
            throw err;
        }
    }

    async function updateCertificate(
        id: string,
        patch: Partial<Certificate>
    ): Promise<Certificate | null> {
        try {
            const updated = await certificateService.update(id, patch);
            if (!updated) return null;
            setCertificates((prev) =>
                prev.map((c) => (c.id === id ? updated : c)),
            );
            return updated;
        } catch (err) {
            console.error('Failed to update certificate', err);
            setError('Failed to update certificate');
            throw err;
        }
    }

    async function removeCertificate(id: string): Promise<void> {
        try {
            await certificateService.remove(id);
            setCertificates((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error('Failed to delete certificate', err);
            setError('Failed to delete certificate');
            throw err;
        }
    }

    async function clearCertificates(): Promise<void> {
        try {
            await certificateService.clear();
            setCertificates([]);
        } catch (err) {
            console.error('Failed to clear certificates', err);
            setError('Failed to clear certificates');
            throw err;
        }
    }

    return {
        certificates,
        loading,
        error,
        addCertificate,
        updateCertificate,
        removeCertificate,
        clearCertificates,
    };
}
