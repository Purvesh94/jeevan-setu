import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/landing/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { RoleSelectPage } from '@/pages/auth/RoleSelectPage';
import { UserDashboard } from '@/pages/dashboard/UserDashboard';
import { EmergencySOSPage } from '@/pages/emergency/EmergencySOSPage';
import { EmergencyDetailPage } from '@/pages/emergency/EmergencyDetailPage';
import { HospitalFinderPage } from '@/pages/hospital/HospitalFinderPage';
import { EmergencyMapPage } from '@/pages/hospital/EmergencyMapPage';
import { CredentialWalletPage } from '@/pages/credential/CredentialWalletPage';
import { ConsentPage } from '@/pages/consent/ConsentPage';
import { EmergencyHistoryPage } from '@/pages/emergency/EmergencyHistoryPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { AffiliateDashboard } from '@/pages/affiliate/AffiliateDashboard';
import { AffiliateEmergenciesPage } from '@/pages/affiliate/AffiliateEmergenciesPage';
import { CredentialVerificationPage } from '@/pages/affiliate/CredentialVerificationPage';
import { AuditLogPage } from '@/pages/affiliate/AuditLogPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminAffiliatesPage } from '@/pages/admin/AdminAffiliatesPage';
import { AdminHospitalsPage } from '@/pages/admin/AdminHospitalsPage';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-action border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.role) return <Navigate to="/role-select" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  const { user, profile } = useAuth();

  const getDashboardRedirect = () => {
    if (!profile) return '/dashboard';
    switch (profile.role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'MEDICAL_AFFILIATE': return '/affiliate/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to={getDashboardRedirect()} /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardRedirect()} /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to={getDashboardRedirect()} /> : <SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/role-select" element={user ? <RoleSelectPage /> : <Navigate to="/login" />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* User routes */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/emergency" element={<EmergencySOSPage />} />
        <Route path="/emergency/:id" element={<EmergencyDetailPage />} />
        <Route path="/hospitals" element={<HospitalFinderPage />} />
        <Route path="/map" element={<EmergencyMapPage />} />
        <Route path="/credentials" element={<CredentialWalletPage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/history" element={<EmergencyHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<ProfilePage />} />

        {/* Affiliate routes */}
        <Route path="/affiliate/dashboard" element={
          <ProtectedRoute roles={['MEDICAL_AFFILIATE', 'ADMIN']}><AffiliateDashboard /></ProtectedRoute>
        } />
        <Route path="/affiliate/emergencies" element={
          <ProtectedRoute roles={['MEDICAL_AFFILIATE', 'ADMIN']}><AffiliateEmergenciesPage /></ProtectedRoute>
        } />
        <Route path="/affiliate/verification" element={
          <ProtectedRoute roles={['MEDICAL_AFFILIATE', 'ADMIN']}><CredentialVerificationPage /></ProtectedRoute>
        } />
        <Route path="/affiliate/audit" element={
          <ProtectedRoute roles={['MEDICAL_AFFILIATE', 'ADMIN']}><AuditLogPage /></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path="/admin/affiliates" element={
          <ProtectedRoute roles={['ADMIN']}><AdminAffiliatesPage /></ProtectedRoute>
        } />
        <Route path="/admin/hospitals" element={
          <ProtectedRoute roles={['ADMIN']}><AdminHospitalsPage /></ProtectedRoute>
        } />
        <Route path="/admin/emergencies" element={
          <ProtectedRoute roles={['ADMIN']}><AffiliateEmergenciesPage /></ProtectedRoute>
        } />
        <Route path="/admin/audit" element={
          <ProtectedRoute roles={['ADMIN']}><AuditLogPage /></ProtectedRoute>
        } />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
