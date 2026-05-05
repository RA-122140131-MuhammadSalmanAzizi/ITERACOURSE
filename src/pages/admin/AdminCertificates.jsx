import { useState } from 'react';
import {
    Award, Eye, Search, Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminPages.css';

const AdminCertificates = () => {
    const { certificates } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const allCertificates = certificates || [
        { id: 'CERT-001-2024', courseId: 1, courseName: 'React Fundamentals', issuedDate: '2024-01-15', userName: 'John Customer' },
        { id: 'CERT-002-2024', courseId: 2, courseName: 'Python Masterclass', issuedDate: '2024-01-20', userName: 'Jane Learner' },
    ];

    const filteredCertificates = allCertificates.filter(cert =>
        cert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleView = (cert) => {
        alert(`Certificate Details:\n\nID: ${cert.id}\nRecipient: ${cert.userName}\nCourse: ${cert.courseName}\nIssued: ${formatDate(cert.issuedDate)}`);
    };

    const handleDownload = (cert) => {
        alert(`Downloading certificate ${cert.id} for ${cert.userName}...\n\nIn a real application, this would generate a PDF certificate.`);
    };

    return (
        <div className="admin-page">
            <AdminSidebar />

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Certificates Management</h1>
                        <p>View and manage all issued certificates</p>
                    </div>
                </header>

                <section className="content-section">
                    <div className="filter-bar">
                        <div className="search-input">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by ID, user, or course..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Certificate ID</th>
                                    <th>Recipient</th>
                                    <th>Course</th>
                                    <th>Issue Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCertificates.map(cert => (
                                    <tr key={cert.id}>
                                        <td>
                                            <span className="cert-id">{cert.id}</span>
                                        </td>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {cert.userName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="user-name">{cert.userName}</span>
                                            </div>
                                        </td>
                                        <td>{cert.courseName}</td>
                                        <td>{formatDate(cert.issuedDate)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleView(cert)}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleDownload(cert)}
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredCertificates.length === 0 && (
                        <div className="empty-state">
                            <Award size={48} />
                            <h3>No certificates found</h3>
                            <p>No certificates match your search criteria.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminCertificates;

