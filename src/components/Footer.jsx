import { Link } from 'react-router-dom';
import { BookOpen, Twitter, Github, Linkedin, Mail, Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <div className="logo-icon" style={{ background: 'transparent' }}>
                                <img src="/Logo_ITERA.png" alt="ITERA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span>ITERA Course</span>
                        </Link>
                        <p className="footer-description">
                            Empowering learners worldwide with quality education.
                            Learn from industry experts and advance your career.
                        </p>
                        <div className="footer-social">
                            <a href="#" className="social-link" aria-label="Twitter">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="social-link" aria-label="Github">
                                <Github size={18} />
                            </a>
                            <a href="#" className="social-link" aria-label="LinkedIn">
                                <Linkedin size={18} />
                            </a>
                            <a href="#" className="social-link" aria-label="Email">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <h4>Platform</h4>
                        <ul>
                            <li><Link to="/courses">All Courses</Link></li>
                            <li><a href="#">Become Instructor</a></li>
                            <li><a href="#">Pricing</a></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4>Categories</h4>
                        <ul>
                            <li><a href="#">Web Development</a></li>
                            <li><a href="#">Programming</a></li>
                            <li><a href="#">Design</a></li>
                            <li><a href="#">Data Science</a></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} ITERA Course. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

