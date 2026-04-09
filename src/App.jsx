import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleGate from './auth/RoleGate';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import MembersPage from './pages/MembersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/members"
                element={
                  <ProtectedRoute>
                    <RoleGate requiredRole="member">
                      <MembersPage />
                    </RoleGate>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
