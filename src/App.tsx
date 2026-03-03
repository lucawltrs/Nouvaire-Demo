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
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
