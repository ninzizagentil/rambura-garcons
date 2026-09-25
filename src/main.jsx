  import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ScrollToTop from './components/common/ScrollToTop.jsx'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './context/ToastContext'

// Remove legacy business records from local storage.
const LEGACY_BUSINESS_KEYS = [
  'rg_users', 'rg_books', 'rg_loans', 'rg_stock_items', 'rg_stock_transactions',
  'rg_stock_damaged', 'rg_stock_removed', 'rg_stock_suppliers', 'rg_activity',
  'rg_applications', 'rg_notifications', 'rg_content_hero', 'rg_content_programs',
  'rg_content_departments', 'rg_content_staff', 'rg_content_news', 'rg_content_gallery',
  'rg_content_admissions', 'rg_content_contact', 'rg_content_site_images', 'rg_content_branding',
]

LEGACY_BUSINESS_KEYS.forEach((key) => window.localStorage.removeItem(key))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <NotificationProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </NotificationProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
