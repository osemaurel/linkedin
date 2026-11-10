import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/admin/AdminLayout';
import { RequireAdmin } from './components/admin/RequireAdmin';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { RequireOnboarding } from './components/RequireOnboarding';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Demarrer from './pages/Demarrer';
import Dashboard from './pages/Dashboard';
import MonProfil from './pages/MonProfil';
import Audit from './pages/Audit';
import Strategie from './pages/Strategie';
import PlanEditorial from './pages/PlanEditorial';
import Studio from './pages/Studio';
import MonReseau from './pages/MonReseau';
import Compte from './pages/Compte';
import Paiement from './pages/Paiement';
import NotFound from './pages/NotFound';

// Page d'accueil publique (marque Optimisation) : chargée à la demande.
const Landing = lazy(() => import('./landing/Landing'));

// Centre de contrôle : chargé à la demande, jamais téléchargé par un utilisateur normal.
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminUserDetail = lazy(() => import('./pages/admin/UserDetail'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminGenerations = lazy(() => import('./pages/admin/Generations'));
const AdminAuditLog = lazy(() => import('./pages/admin/AuditLog'));
const AdminPricing = lazy(() => import('./pages/admin/Pricing'));

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-16" role="status">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          <span className="sr-only">Chargement…</span>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="landing"
        element={
          <Suspense fallback={null}>
            <Landing />
          </Suspense>
        }
      />
      <Route path="connexion" element={<Connexion />} />
      <Route path="inscription" element={<Inscription />} />
      <Route element={<RequireAuth />}>
        <Route path="admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route
              index
              element={
                <AdminPage>
                  <AdminOverview />
                </AdminPage>
              }
            />
            <Route
              path="utilisateurs"
              element={
                <AdminPage>
                  <AdminUsers />
                </AdminPage>
              }
            />
            <Route
              path="utilisateurs/:id"
              element={
                <AdminPage>
                  <AdminUserDetail />
                </AdminPage>
              }
            />
            <Route
              path="paiements"
              element={
                <AdminPage>
                  <AdminPayments />
                </AdminPage>
              }
            />
            <Route
              path="tarifs"
              element={
                <AdminPage>
                  <AdminPricing />
                </AdminPage>
              }
            />
            <Route
              path="ia"
              element={
                <AdminPage>
                  <AdminGenerations />
                </AdminPage>
              }
            />
            <Route
              path="journal"
              element={
                <AdminPage>
                  <AdminAuditLog />
                </AdminPage>
              }
            />
            <Route
              path="*"
              element={
                <AdminPage>
                  <AdminOverview />
                </AdminPage>
              }
            />
          </Route>
        </Route>
        <Route element={<Layout />}>
          <Route element={<RequireOnboarding />}>
            <Route index element={<Dashboard />} />
            <Route path="demarrer" element={<Demarrer />} />
            <Route path="profil" element={<MonProfil />} />
            <Route path="audit" element={<Audit />} />
            <Route path="strategie" element={<Strategie />} />
            <Route path="plan" element={<PlanEditorial />} />
            <Route path="studio" element={<Studio />} />
            <Route path="reseau" element={<MonReseau />} />
            <Route path="compte" element={<Compte />} />
            <Route path="paiement/:id" element={<Paiement />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
