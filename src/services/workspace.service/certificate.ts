import type { Certificate } from "../../types/workspace";
import { getWorkspaceDb } from "./database";

import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, mkdir, readFile, writeFile } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";

import * as pdfjs from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// pdfjs worker (Vite)
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

type CertRow = {
    id: string;
    name: string;
    description: string;
    issued_by: string;
    issue_date: string;
    expiry_date: string | null;
    credential_url: string | null;

    // NEW columns
    file_path: string | null;
    preview_data_url: string | null;
};

function has<T extends object>(obj: T, key: keyof any): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function toDate(v: unknown): Date | undefined {
    if (v === null || v === undefined) return undefined;
    const d = v instanceof Date ? v : new Date(v as any);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function rowToCert(r: CertRow): Certificate {
    return {
        id: r.id,
        name: r.name,
        description: r.description,
        issuedBy: r.issued_by,
        issueDate: new Date(r.issue_date),
        expiryDate: r.expiry_date ? new Date(r.expiry_date) : undefined,
        credentialUrl: r.credential_url ?? undefined,

        filePath: r.file_path ?? undefined,
        previewDataUrl: r.preview_data_url ?? undefined,
    };
}

const CERT_DIR_REL = "persony/workspace/certificates";

async function ensureCertDir() {
    await mkdir(CERT_DIR_REL, { baseDir: BaseDirectory.AppData, recursive: true });
}

async function renderFirstPagePreviewDataUrl(pdfBytes: Uint8Array, targetWidth = 420): Promise<string> {
    const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
    const page = await doc.getPage(1);

    const v1 = page.getViewport({ scale: 1 });
    const scale = targetWidth / v1.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // ✅ pdfjs versi baru: wajib `canvas`
    await page.render({ canvas, viewport }).promise;

    doc.destroy();
    return canvas.toDataURL("image/jpeg", 0.75);
}

class CertificateService {
    async getAll(): Promise<Certificate[]> {
        const db = await getWorkspaceDb();
        const rows = await db.select<CertRow[]>(
            `SELECT * FROM workspace_certificates ORDER BY issue_date DESC`
        );
        return rows.map(rowToCert);
    }

    async add(data: Omit<Certificate, "id">): Promise<Certificate> {
        const db = await getWorkspaceDb();
        const id = crypto.randomUUID();

        await db.execute(
            `INSERT INTO workspace_certificates
        (id, name, description, issued_by, issue_date, expiry_date, credential_url, file_path, preview_data_url)
       VALUES (?,?,?,?,?,?,?,?,?)`,
            [
                id,
                data.name,
                data.description,
                data.issuedBy,
                (toDate(data.issueDate) ?? new Date()).toISOString(),
                data.expiryDate ? (toDate(data.expiryDate) ?? new Date(data.expiryDate as any)).toISOString() : null,
                data.credentialUrl ?? null,

                // NEW
                data.filePath ?? null,
                data.previewDataUrl ?? null,
            ]
        );

        return { ...data, id };
    }

    async update(id: string, patch: Partial<Certificate>): Promise<Certificate | null> {
        const db = await getWorkspaceDb();
        const rows = await db.select<CertRow[]>(
            `SELECT * FROM workspace_certificates WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;

        const current = rowToCert(rows[0]);

        const updated: Certificate = {
            ...current,
            ...patch,
            issueDate: has(patch, "issueDate")
                ? (toDate((patch as any).issueDate) ?? current.issueDate)
                : current.issueDate,
            expiryDate: has(patch, "expiryDate") ? toDate((patch as any).expiryDate) : current.expiryDate,
            credentialUrl: has(patch, "credentialUrl") ? (patch.credentialUrl ?? undefined) : current.credentialUrl,
            description: has(patch, "description") ? (patch.description ?? current.description) : current.description,
            issuedBy: has(patch, "issuedBy") ? (patch.issuedBy ?? current.issuedBy) : current.issuedBy,
            name: has(patch, "name") ? (patch.name ?? current.name) : current.name,

            // NEW
            filePath: has(patch, "filePath") ? (patch.filePath ?? undefined) : current.filePath,
            previewDataUrl: has(patch, "previewDataUrl") ? (patch.previewDataUrl ?? undefined) : current.previewDataUrl,
        };

        await db.execute(
            `UPDATE workspace_certificates
       SET name=?, description=?, issued_by=?, issue_date=?, expiry_date=?, credential_url=?, file_path=?, preview_data_url=?
       WHERE id=?`,
            [
                updated.name,
                updated.description,
                updated.issuedBy,
                updated.issueDate.toISOString(),
                updated.expiryDate ? updated.expiryDate.toISOString() : null,
                updated.credentialUrl ?? null,

                // NEW
                updated.filePath ?? null,
                updated.previewDataUrl ?? null,

                id,
            ]
        );

        return updated;
    }

    async remove(id: string): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_certificates WHERE id = ?`, [id]);
    }

    async clear(): Promise<void> {
        const db = await getWorkspaceDb();
        await db.execute(`DELETE FROM workspace_certificates`);
    }

    async pickPdfPath(): Promise<string | null> {
        const selected = await open({
            multiple: false,
            filters: [{ name: "PDF", extensions: ["pdf"] }],
        });
        return typeof selected === "string" ? selected : null;
    }

    async attachPdf(id: string, sourcePdfPath: string): Promise<Certificate | null> {
        await ensureCertDir();

        // read original bytes (butuh fs scope untuk folder user)
        const pdfBytes = await readFile(sourcePdfPath);

        // save to AppData (relative path)
        const pdfRel = `${CERT_DIR_REL}/${id}.pdf`;
        await writeFile(pdfRel, pdfBytes, { baseDir: BaseDirectory.AppData });

        // generate preview
        const previewDataUrl = await renderFirstPagePreviewDataUrl(pdfBytes);

        // update DB
        return await this.update(id, {
            filePath: pdfRel,
            previewDataUrl,
        });
    }

    async openPdf(cert: Certificate): Promise<void> {
        if (!cert.filePath) return;

        const base = await appDataDir();
        const abs = await join(base, cert.filePath);

        await openPath(abs);
    }
}

export default new CertificateService();
