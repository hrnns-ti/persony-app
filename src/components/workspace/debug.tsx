// src/components/debug/CertificatesDebug.tsx
import { useState } from 'react';
import { useCertificates } from '../../hooks/workspace/useCertificates.ts';

export default function CertificatesDebug() {
    const {
        certificates,
        loading,
        error,
        addCertificate,
        removeCertificate,
    } = useCertificates();

    const [name, setName] = useState('');
    const [issuer, setIssuer] = useState('');
    const [url, setUrl] = useState('');

    async function handleAdd() {
        if (!name) return;
        await addCertificate({
            name,
            issuedBy: issuer || 'Unknown',
            description: '',
            issueDate: new Date(),
            credentialUrl: url || undefined,
        });
        setName('');
        setIssuer('');
        setUrl('');
    }

    if (loading) return <div style={{ padding: 16 }}>Loading certificates...</div>;
    if (error) return <div style={{ padding: 16 }}>{error}</div>;

    return (
        <div style={{ padding: 16, fontFamily: 'system-ui', fontSize: 14 }}>
            <h2>Certificates Debug</h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Certificate name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Issuer"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Credential URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <button onClick={handleAdd}>Add</button>
            </div>

            <ul>
                {certificates.map((c) => (
                    <li key={c.id}>
                        {c.name} – {c.issuedBy}{' '}
                        <button onClick={() => removeCertificate(c.id)}>X</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
