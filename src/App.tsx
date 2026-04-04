import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './lib/auth/ProtectedRoute';
import { MainLayout } from './app/layouts/MainLayout';
import { LoginPage } from './app/pages/LoginPage';
import { DashboardPage } from './app/pages/DashboardPage';
import { InboxPage } from './app/pages/InboxPage';
import { InboxChatPage } from './app/pages/InboxChatPage';
import FourBasedPage from './app/pages/FourBasedPage';
import FourBasedModelsPage from './app/pages/FourBasedModelsPage';
import { FourBasedModelDetailPage } from './modules/4based/pages/FourBasedModelDetailPage';
import { FourBasedModelStatisticsPage } from './modules/4based/pages/FourBasedModelStatisticsPage';
import { FourBasedModelChatsPage } from './modules/4based/pages/FourBasedModelChatsPage';
import { FourBasedModelSingleChatPage } from './modules/4based/pages/FourBasedModelSingleChatPage';
import { useAuthStore } from './lib/auth/useAuthStore';
import CloudOverviewPage from './app/pages/cloud/CloudOverviewPage';
import CloudUserAssetsPage from './app/pages/cloud/CloudUserAssetsPage';
import { AccountsListPage } from './app/pages/accounts/AccountsListPage';
import { AccountDetailPage } from './app/pages/accounts/AccountDetailPage';
import { SettingsPage } from './app/pages/SettingsPage';
import { TeamMembersPage } from './app/pages/settings/TeamMembersPage';
import { TeamMemberDetailPage } from './app/pages/settings/TeamMemberDetailPage';
import { FourBasedAccountsPage } from './app/pages/settings/FourBasedAccountsPage';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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
            path="/4based"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FourBasedPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/4based/models"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FourBasedModelsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/4based/models/:fourbasedId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FourBasedModelDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/4based/models/:fourbasedId/statistics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FourBasedModelStatisticsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/4based/models/:fourbasedId/chats"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FourBasedModelChatsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/4based/models/:fourbasedId/chats/:chatId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FourBasedModelSingleChatPage />
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
          <Route path="*" element={<Navigate to="/" replace />} />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
