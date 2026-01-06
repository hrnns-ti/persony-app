// src/services/workspace.service/certificate.service.ts
import type { Certificate } from '../../types/workspace';

const STORAGE_KEY = 'persony_workspace_certificates';

class CertificateService {
    private readRaw(): Certificate[] {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Certificate[];
            return parsed.map((c) => ({
                ...c,
                issueDate: new Date(c.issueDate),
                expiryDate: c.expiryDate ? new Date(c.expiryDate) : undefined,
            }));
        } catch {
            return [];
        }
    }

    private writeRaw(items: Certificate[]): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    async getAll(): Promise<Certificate[]> {
        return this.readRaw();
    }

    async add(
        data: Omit<Certificate, 'id'>
    ): Promise<Certificate> {
        const all = this.readRaw();

        const cert: Certificate = {
            ...data,
            id: crypto.randomUUID(),
        };

        all.push(cert);
        this.writeRaw(all);
        return cert;
    }

    async update(
        id: string,
        patch: Partial<Certificate>
    ): Promise<Certificate | null> {
        const all = this.readRaw();
        const index = all.findIndex((c) => c.id === id);
        if (index === -1) return null;

        const updated: Certificate = {
            ...all[index],
            ...patch,
        };

        all[index] = updated;
        this.writeRaw(all);
        return updated;
    }

    async remove(id: string): Promise<void> {
        const all = this.readRaw();
        this.writeRaw(all.filter((c) => c.id !== id));
    }

    async clear(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    }
}

const certificateService = new CertificateService();
export default certificateService;