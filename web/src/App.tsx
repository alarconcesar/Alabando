import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import InstallPrompt from './components/InstallPrompt';
import { ROUTES } from './lib/constants';
import { useTheme } from './hooks/useTheme';

// ── Lazy-loaded pages ────────────────────────────────────
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const HymnDetail = lazy(() => import('./pages/HymnDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Albumes = lazy(() => import('./pages/Albumes'));
const Favoritos = lazy(() => import('./pages/Favoritos'));
const Nuevos = lazy(() => import('./pages/Nuevos'));
const History = lazy(() => import('./pages/History'));
const AllHymns = lazy(() => import('./pages/AllHymns'));

const Loading = () => (
  <div style={{ padding: 40, textAlign: 'center', color: 'var(--outline)' }}>
    Cargando...
  </div>
);

function App() {
  useTheme();

  return (
    <Router>
      <div className="app-layout">
        <Navigation />
        <div className="main-content-wrapper">
          <Suspense fallback={<Loading />}>
            <ErrorBoundary>
              <Routes>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.SEARCH} element={<Search />} />
                <Route path={ROUTES.ALBUMES} element={<Albumes />} />
                <Route path={ROUTES.FAVORITOS} element={<Favoritos />} />
                <Route path={ROUTES.NUEVOS} element={<Nuevos />} />
                <Route path={ROUTES.ALL_HYMNS} element={<AllHymns />} />
                <Route path={ROUTES.HISTORY} element={<History />} />
                <Route path={ROUTES.HYMN_DETAIL} element={<HymnDetail />} />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </div>
        <InstallPrompt />
      </div>
    </Router>
  );
}

export default App;
