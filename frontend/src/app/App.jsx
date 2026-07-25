// src/App.jsx

// 
import { Toaster } from '@/components/ui/sonner';
// import { useDevTools } from '@/core/hooks/useDevTools';
import { TooltipProvider } from '@/components/ui/tooltip';
// import { useConsoleBranding } from '@/core/hooks/useConsoleBranding';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/core/contexts/auth.context';
import { UIProvider } from '@/core/contexts/ui.context';
import { ApiProvider } from '@/core/contexts/api.context';
import ScrollToTop from '@/core/utils/scrolltotop.util';
import './app.css';
import AppRoutes from '@/core/router/app.routes';

export default function App() {
  // useDevTools();
  // useConsoleBranding()



 

  return (
    <Router>
      <AuthProvider>
        <UIProvider>
          <ApiProvider>
            <TooltipProvider>
              <ScrollToTop />
              <Toaster />
              <AppRoutes />
            </TooltipProvider>
          </ApiProvider>
        </UIProvider>
      </AuthProvider>
    </Router>
  );
}



