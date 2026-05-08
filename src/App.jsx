import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Pages
import HomePage from './pages/customer/HomePage';
import CoursesPage from './pages/customer/CoursesPage';
import CourseDetailPage from './pages/customer/CourseDetailPage';
import WatchCoursePage from './pages/customer/WatchCoursePage';
import FullscreenQuizPage from './pages/customer/FullscreenQuizPage';
import LoginPage from './pages/auth/LoginPage';

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

// Shared Pages
import NotificationsPage from './pages/shared/NotificationsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/course/:id" element={<CourseDetailPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />

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
            <Route path="/customer/notifications" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />

            {/* Legacy Redirects */}
            <Route path="/profile" element={<Navigate to="/customer/profile" replace />} />
            <Route path="/my-certificates" element={<Navigate to="/customer/certificates" replace />} />

            {/* Shared Authenticated Routes */}
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />

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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
