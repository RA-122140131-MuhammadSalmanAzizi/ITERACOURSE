import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext, useEffect } from 'react';
import './index.css';

// Pages
import HomePage from './pages/customer/HomePage';
import CoursesPage from './pages/customer/CoursesPage';
import CourseDetailPage from './pages/customer/CourseDetailPage';
import WatchCoursePage from './pages/customer/WatchCoursePage';
import FullscreenQuizPage from './pages/customer/FullscreenQuizPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Customer Dashboard Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProfilePage from './pages/customer/ProfilePage';
import CertificatesPage from './pages/customer/CertificatesPage';
import CustomerCourses from './pages/customer/CustomerCourses';
import CustomerReviews from './pages/customer/CustomerReviews';
import CustomerQuizHistory from './pages/customer/CustomerQuizHistory';
import CustomerWishlist from './pages/customer/CustomerWishlist';
import CustomerOrders from './pages/customer/CustomerOrders';

// Dosen Pages
import DosenDashboard from './pages/dosen/DosenDashboard';
import DosenCourses from './pages/dosen/DosenCourses';
import DosenUploadCourse from './pages/dosen/DosenUploadCourse';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCourseSettings from './pages/admin/AdminCourseSettings';
import AdminData from './pages/admin/AdminData';
import AdminFAQ from './pages/admin/AdminFAQ';
import FAQPage from './pages/customer/FAQPage';

// Context
export const AuthContext = createContext();
export const ThemeContext = createContext();

export const useAuth = () => useContext(AuthContext);
export const useTheme = () => useContext(ThemeContext);

// Mock user data
const mockUsers = [
  { id: 1, email: 'customer@demo.com', password: 'demo123', name: 'John Customer', role: 'customer', avatar: 'JC' },
  { id: 2, email: 'dosen@demo.com', password: 'demo123', name: 'Dr. Ahmad Lecturer', role: 'dosen', avatar: 'DL' },
  { id: 3, email: 'admin@demo.com', password: 'demo123', name: 'Admin User', role: 'admin', avatar: 'AU' },
];

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });
  const [enrolledCourses, setEnrolledCourses] = useState([1, 3]);
  const [completedCourses, setCompletedCourses] = useState([1]);
  const [wishlist, setWishlist] = useState([]);
  const [certificates, setCertificates] = useState([
    { id: 'CERT-001-2024', courseId: 1, courseName: 'React Fundamentals', issuedDate: '2024-01-15', userName: 'John Customer' },
    { id: 'CERT-002-2024', courseId: 2, courseName: 'Python Masterclass', issuedDate: '2024-02-20', userName: 'Jane Learner' },
    { id: 'CERT-003-2024', courseId: 3, courseName: 'UI/UX Design', issuedDate: '2024-03-10', userName: 'Alex Designer' }
  ]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const login = (email, password) => {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      return { success: true, user: foundUser };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const register = (name, email, password) => {
    const exists = mockUsers.find(u => u.email === email);
    if (exists) {
      return { success: false, error: 'Email already exists' };
    }
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password,
      name,
      role: 'customer',
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
    };
    mockUsers.push(newUser);
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
  };

  const enrollCourse = (courseId) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId]);
    }
  };

  const completeCourse = (courseId) => {
    if (!completedCourses.includes(courseId)) {
      setCompletedCourses([...completedCourses, courseId]);
    }
  };

  const addToWishlist = (courseId) => {
    if (!wishlist.includes(courseId)) {
      setWishlist([...wishlist, courseId]);
    }
  };

  const removeFromWishlist = (courseId) => {
    setWishlist(wishlist.filter(id => id !== courseId));
  };

  const claimCertificate = (courseId, courseName) => {
    const certId = `CERT-${String(certificates.length + 1).padStart(3, '0')}-${new Date().getFullYear()}`;
    const newCert = {
      id: certId,
      courseId,
      courseName,
      issuedDate: new Date().toISOString().split('T')[0],
      userName: user?.name || 'Unknown'
    };
    setCertificates([...certificates, newCert]);
    return certId;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{
        user,
        login,
        logout,
        register,
        enrolledCourses,
        completedCourses,
        wishlist,
        enrollCourse,
        completeCourse,
        addToWishlist,
        removeFromWishlist,
        certificates,
        claimCertificate
      }}>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/course/:id" element={<CourseDetailPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Dashboard Routes */}
            <Route path="/customer/dashboard" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={['customer', 'dosen', 'admin']}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/customer/courses" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerCourses />
              </ProtectedRoute>
            } />
            <Route path="/customer/certificates" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CertificatesPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/reviews" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerReviews />
              </ProtectedRoute>
            } />
            <Route path="/customer/quiz-history" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerQuizHistory />
              </ProtectedRoute>
            } />
            <Route path="/customer/wishlist" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerWishlist />
              </ProtectedRoute>
            } />
            <Route path="/customer/orders" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerOrders />
              </ProtectedRoute>
            } />

            {/* Legacy/Shortcut Routes Redirects or Direct Access */}
            <Route path="/profile" element={<Navigate to="/customer/profile" replace />} />
            <Route path="/my-certificates" element={<Navigate to="/customer/certificates" replace />} />

            <Route path="/watch/:id" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <WatchCoursePage />
              </ProtectedRoute>
            } />
            <Route path="/course/quiz/:courseId/:contentId" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <FullscreenQuizPage />
              </ProtectedRoute>
            } />

            {/* Dosen Routes */}
            <Route path="/dosen" element={
              <ProtectedRoute allowedRoles={['dosen']}>
                <DosenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dosen/courses" element={
              <ProtectedRoute allowedRoles={['dosen']}>
                <DosenCourses />
              </ProtectedRoute>
            } />
            <Route path="/dosen/upload" element={
              <ProtectedRoute allowedRoles={['dosen']}>
                <DosenUploadCourse />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCourses />
              </ProtectedRoute>
            } />
            <Route path="/admin/reviews" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReviews />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCourseSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/data" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminData />
              </ProtectedRoute>
            } />
            <Route path="/admin/faq" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminFAQ />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;

