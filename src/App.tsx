import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './lib/auth/ProtectedRoute';
import { MainLayout } from './app/layouts/MainLayout';
import { LoginPage } from './app/pages/LoginPage';
import { DashboardPage } from './app/pages/DashboardPage';
import { EggfinderPage } from './app/pages/EggfinderPage';
import { ProducersPage } from './modules/producers';
import { ProductsPage, ProductDetailPage } from './modules/products';
import { ProjectsPage } from './modules/projects';

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
          path="/eggfinder"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EggfinderPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/producers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProducersPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProductsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProductDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProjectsPage />
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
