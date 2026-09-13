import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import RentalsPage from './pages/RentalsPage';
import RentalDetailPage from './pages/RentalDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SavedPage from './pages/SavedPage';
import InsightsPage from './pages/InsightsPage';
import './styles/index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/listings" replace /> : <LoginPage />} />
        <Route path="/listings" element={<ProtectedRoute><ListingsPage /></ProtectedRoute>} />
        <Route path="/listings/:id" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
        <Route path="/rentals" element={<ProtectedRoute><RentalsPage /></ProtectedRoute>} />
        <Route path="/rentals/:id" element={<ProtectedRoute><RentalDetailPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/listings" : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
