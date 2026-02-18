import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './lib/auth/ProtectedRoute';
import { MainLayout } from './app/layouts/MainLayout';
import { LoginPage } from './app/pages/LoginPage';
import { DashboardPage } from './app/pages/DashboardPage';
import { BlogListPage } from './modules/blog/pages/BlogListPage';
import { BlogEditorPage } from './modules/blog/pages/BlogEditorPage';
import { BlogPreviewPage } from './modules/blog/pages/BlogPreviewPage';

function App() {
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
          path="/blog"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BlogListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/blog/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BlogEditorPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/blog/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BlogEditorPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/blog/:id/preview"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BlogPreviewPage />
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
