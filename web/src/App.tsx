import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import InstallPrompt from './components/InstallPrompt';
import PageTransition from './components/PageTransition';
import { SkeletonHome, SkeletonAlbumes, SkeletonDetail } from './components/Skeletons';
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

// ── Per-route Suspense wrappers ──────────────────────────
function LazyPage({ component: Comp, skeleton }: { component: React.ComponentType; skeleton: React.ReactNode }) {
  return (
    <Suspense fallback={<>{skeleton}</>}>
      <PageTransition>
        <Comp />
      </PageTransition>
    </Suspense>
  );
}

function SkeletonList({ count = 8 }: { count?: number }) {
  // Simple skeleton list — mirrors the pattern used inside each page
  return (
    <div>
      <div className="himno-item-divider" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton-himno-item-fallback" style={{ display: 'flex', alignItems: 'center', padding: 16, gap: 12 }}>
            <div className="skeleton-fallback" style={{ width: 60, height: 27, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-fallback" style={{ height: 18, width: '65%' }} />
              <div className="skeleton-fallback" style={{ height: 14, width: '40%' }} />
            </div>
            <div className="skeleton-fallback" style={{ width: 25, height: 25, borderRadius: '50%', flexShrink: 0 }} />
          </div>
          <div className="himno-item-divider" />
        </div>
      ))}
    </div>
  );
}

function App() {
  useTheme();

  return (
    <Router>
      <div className="app-layout">
        <Navigation />
        <div className="main-content-wrapper">
          <ErrorBoundary>
            <Routes>
              <Route path={ROUTES.HOME} element={<LazyPage component={Home} skeleton={<SkeletonHome />} />} />
              <Route path={ROUTES.SEARCH} element={<LazyPage component={Search} skeleton={<SkeletonList count={8} />} />} />
              <Route path={ROUTES.ALBUMES} element={<LazyPage component={Albumes} skeleton={<SkeletonAlbumes />} />} />
              <Route path={ROUTES.FAVORITOS} element={<LazyPage component={Favoritos} skeleton={<SkeletonList count={5} />} />} />
              <Route path={ROUTES.NUEVOS} element={<LazyPage component={Nuevos} skeleton={<SkeletonList count={10} />} />} />
              <Route path={ROUTES.ALL_HYMNS} element={<LazyPage component={AllHymns} skeleton={<SkeletonList count={10} />} />} />
              <Route path={ROUTES.HISTORY} element={<LazyPage component={History} skeleton={<SkeletonList count={5} />} />} />
              <Route path={ROUTES.HYMN_DETAIL} element={<LazyPage component={HymnDetail} skeleton={<SkeletonDetail />} />} />
              <Route path={ROUTES.SETTINGS} element={<LazyPage component={Settings} skeleton={<div style={{ padding: 40, textAlign: 'center' }} />} />} />
            </Routes>
          </ErrorBoundary>
        </div>
        <InstallPrompt />
      </div>
    </Router>
  );
}

export default App;
