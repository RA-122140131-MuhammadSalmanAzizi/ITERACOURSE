import React, { forwardRef } from 'react';

// This component is rendered off-screen and captured by html2canvas to generate the PDF
const CertificateTemplate = forwardRef(({ certificate, profileName }, ref) => {
    const issuedDate = certificate?.issued_at
        ? new Date(certificate.issued_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
          })
        : '';

    return (
        <div
            ref={ref}
            style={{
                width: '1122px',
                height: '793px',
                position: 'relative',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                background: '#fffdf5',
                overflow: 'hidden',
                flexShrink: 0,
            }}
        >
            {/* Outer decorative border */}
            <div style={{
                position: 'absolute',
                inset: '20px',
                border: '3px solid #b7943f',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                inset: '28px',
                border: '1px solid #d4af6a',
                pointerEvents: 'none',
            }} />

            {/* Corner ornaments */}
            {[
                { top: 14, left: 14 },
                { top: 14, right: 14, transform: 'scaleX(-1)' },
                { bottom: 14, left: 14, transform: 'scaleY(-1)' },
                { bottom: 14, right: 14, transform: 'scale(-1)' },
            ].map((pos, i) => (
                <div key={i} style={{ position: 'absolute', width: 44, height: 44, ...pos }}>
                    <svg viewBox="0 0 44 44" width="44" height="44">
                        <path d="M2 2 L2 18 M2 2 L18 2" stroke="#b7943f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                        <circle cx="2" cy="2" r="3" fill="#b7943f"/>
                    </svg>
                </div>
            ))}

            {/* Background watermark logo text */}
            <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '160px',
                fontWeight: 900,
                color: 'rgba(183, 148, 63, 0.06)',
                letterSpacing: '-4px',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                fontFamily: 'Arial, sans-serif',
            }}>
                ITERACOURSE
            </div>

            {/* Content */}
            <div style={{
                position: 'absolute',
                inset: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '0',
            }}>
                {/* Header label */}
                <p style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '5px',
                    textTransform: 'uppercase',
                    color: '#b7943f',
                    margin: '0 0 10px',
                }}>
                    IteraCourse
                </p>

                {/* Main title */}
                <h1 style={{
                    fontSize: '52px',
                    fontWeight: 700,
                    color: '#1a1208',
                    margin: '0 0 8px',
                    lineHeight: 1.1,
                    letterSpacing: '1px',
                }}>
                    Sertifikat
                </h1>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 400,
                    color: '#5a4a2a',
                    margin: '0 0 24px',
                    letterSpacing: '3px',
                    fontStyle: 'italic',
                }}>
                    Penyelesaian Kursus
                </h2>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '60%' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #b7943f)' }} />
                    <span style={{ color: '#b7943f', fontSize: '18px' }}>✦</span>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #b7943f)' }} />
                </div>

                {/* "diberikan kepada" */}
                <p style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13px',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: '#8a7045',
                    margin: '0 0 8px',
                }}>
                    Dengan bangga diberikan kepada
                </p>

                {/* Recipient name */}
                <p style={{
                    fontSize: '42px',
                    fontWeight: 700,
                    color: '#2c1e06',
                    margin: '0 0 18px',
                    letterSpacing: '1px',
                    fontStyle: 'italic',
                }}>
                    {profileName}
                </p>

                {/* "atas keberhasilan" */}
                <p style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13px',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: '#8a7045',
                    margin: '0 0 8px',
                }}>
                    atas keberhasilan menyelesaikan kursus
                </p>

                {/* Course name */}
                <p style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#1a1208',
                    margin: '0 0 24px',
                    maxWidth: '700px',
                    lineHeight: 1.35,
                }}>
                    "{certificate?.course?.title}"
                </p>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '60%' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #b7943f)' }} />
                    <span style={{ color: '#b7943f', fontSize: '18px' }}>✦</span>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #b7943f)' }} />
                </div>

                {/* Footer info row */}
                <div style={{
                    display: 'flex',
                    gap: '60px',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    width: '100%',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#8a7045', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Instruktur</p>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#2c1e06' }}>
                            {certificate?.course?.instructor?.full_name || '—'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid #d4af6a', borderRight: '1px solid #d4af6a', padding: '0 40px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#8a7045', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Tanggal</p>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#2c1e06' }}>{issuedDate}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#8a7045', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Kode Sertifikat</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#b7943f', letterSpacing: '1px', fontFamily: 'monospace' }}>
                            {certificate?.code}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
});

CertificateTemplate.displayName = 'CertificateTemplate';
export default CertificateTemplate;
