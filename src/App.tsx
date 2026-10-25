import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
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
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="connexion" element={<Connexion />} />
      <Route path="inscription" element={<Inscription />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="demarrer" element={<Demarrer />} />
          <Route path="profil" element={<MonProfil />} />
          <Route path="audit" element={<Audit />} />
          <Route path="strategie" element={<Strategie />} />
          <Route path="plan" element={<PlanEditorial />} />
          <Route path="studio" element={<Studio />} />
          <Route path="reseau" element={<MonReseau />} />
          <Route path="compte" element={<Compte />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
