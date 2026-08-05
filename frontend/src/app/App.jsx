


import { Toaster } from '@/components/ui/sonner';

import { TooltipProvider } from '@/components/ui/tooltip';

import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/core/contexts/auth.context';
import { UIProvider } from '@/core/contexts/ui.context';
import { ApiProvider } from '@/core/contexts/api.context';
import ScrollToTop from '@/core/utils/scrolltotop.util';
import './app.css';
import AppRoutes from '@/core/router/app.routes';

export default function App() {
  
  



 

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



