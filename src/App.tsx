import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './lib/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageLoader } from './components/ui/PageLoader';
import { useAuthStore } from './lib/auth/useAuthStore';

const MainLayout = lazy(() => import('./app/layouts/MainLayout').then((m) => ({ default: m.MainLayout })));
const LoginPage = lazy(() => import('./app/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() =>
  import('./app/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const DashboardPage = lazy(() => import('./app/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const InboxPage = lazy(() => import('./app/pages/InboxPage').then((m) => ({ default: m.InboxPage })));
const InboxChatPage = lazy(() => import('./app/pages/InboxChatPage').then((m) => ({ default: m.InboxChatPage })));
const AccountForecastPage = lazy(() =>
  import('./app/pages/accounts/AccountForecastPage').then((m) => ({ default: m.AccountForecastPage }))
);
const CloudOverviewPage = lazy(() => import('./app/pages/cloud/CloudOverviewPage'));
const CloudUserAssetsPage = lazy(() => import('./app/pages/cloud/CloudUserAssetsPage'));
const AccountsListPage = lazy(() =>
  import('./app/pages/accounts/AccountsListPage').then((m) => ({ default: m.AccountsListPage }))
);
const AccountDetailPage = lazy(() =>
  import('./app/pages/accounts/AccountDetailPage').then((m) => ({ default: m.AccountDetailPage }))
);
const SettingsPage = lazy(() => import('./app/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const TeamMembersPage = lazy(() =>
  import('./app/pages/settings/TeamMembersPage').then((m) => ({ default: m.TeamMembersPage }))
);
const TeamMemberDetailPage = lazy(() =>
  import('./app/pages/settings/TeamMemberDetailPage').then((m) => ({ default: m.TeamMemberDetailPage }))
);
const FourBasedAccountsPage = lazy(() =>
  import('./app/pages/settings/FourBasedAccountsPage').then((m) => ({ default: m.FourBasedAccountsPage }))
);
const GroupsPage = lazy(() => import('./app/pages/settings/GroupsPage').then((m) => ({ default: m.GroupsPage })));
const GeneralSettingsPage = lazy(() =>
  import('./app/pages/settings/GeneralSettingsPage').then((m) => ({ default: m.GeneralSettingsPage }))
);
const MyProfilePage = lazy(() => import('./app/pages/MyProfilePage').then((m) => ({ default: m.MyProfilePage })));
const MassMessagesPage = lazy(() =>
  import('./app/pages/MassMessagesPage').then((m) => ({ default: m.MassMessagesPage }))
);
const NotFoundPage = lazy(() => import('./app/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <InboxPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inbox/:fourbased_id/chat/:chat_id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <InboxChatPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cloud"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CloudOverviewPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cloud/users/:fourbased_id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CloudUserAssetsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AccountsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/:fourbased_id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AccountDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/:fourbased_id/forecast"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AccountForecastPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MyProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mass-messages"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MassMessagesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/members"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TeamMembersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/members/:memberId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TeamMemberDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/accounts"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FourBasedAccountsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/groups"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <GroupsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <GeneralSettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NotFoundPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
