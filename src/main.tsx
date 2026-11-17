import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { LangProvider } from './i18n/lang';
import { EstimateProvider } from './state/estimate';
import { AuthProvider } from './state/auth';
import { CatalogProvider } from './state/catalog';
import { CompanyProvider } from './state/company';
import { ContentProvider } from './state/content';
import { Layout } from './components/Layout';
import { PushRegistrar } from './components/PushRegistrar';
import { NotificationPrompt } from './components/NotificationPrompt';
import { isNativeApp } from './native/push';
import Home from './pages/Home';
import { LightingPage, PandalsPage, RentalsPage, SoundPage } from './pages/Services';
import EstimatePage from './pages/Estimate';
import CartPage from './pages/Cart';
import BookingPage from './pages/Booking';
import AccountPage from './pages/Account';
import MyOrdersPage from './pages/MyOrders';
import OffersPage from './pages/Offers';
import ExplorePage from './pages/Explore';
import ContactPage, { CreditsPage } from './pages/Contact';

const AdminPage = lazy(() => import('./pages/Admin'));
const ProviderPage = lazy(() => import('./pages/Provider'));
const Loading = () => <div className="grid min-h-[50vh] place-items-center"><span className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
      <CompanyProvider>
      <CatalogProvider>
      <ContentProvider>
      <EstimateProvider>
        <HashRouter>
          <PushRegistrar />
          <NotificationPrompt />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="pandals" element={<PandalsPage />} />
              <Route path="lighting" element={<LightingPage />} />
              <Route path="rentals" element={<RentalsPage />} />
              <Route path="sound" element={<SoundPage />} />
              <Route path="credits" element={<CreditsPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="estimate" element={<EstimatePage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="orders" element={<MyOrdersPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="admin" element={<Suspense fallback={<Loading />}><AdminPage /></Suspense>} />
              <Route path="offers" element={<OffersPage />} />
              <Route path="provider" element={<Suspense fallback={<Loading />}><ProviderPage /></Suspense>} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </HashRouter>
      </EstimateProvider>
      </ContentProvider>
      </CatalogProvider>
      </CompanyProvider>
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
);

// Lets phones install the site as an app and open it quickly. Skipped on localhost dev and when opened from a file.
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http') && !isNativeApp()) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* not critical */ }); });
}
