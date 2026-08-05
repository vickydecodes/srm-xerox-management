
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

import unserviceableImg from '/logo.png';
import { useAuth } from '@/core/contexts/auth.context';

const roleConfig = {
  super_admin: {
    label: 'Page Not Found',
    message: 'This page doesn’t exist in the super admin workspace.',
    redirect: '/super_admin/',
    cta: 'Go to Admin Dashboard',
  },
  department_admin: {
    label: 'Page Not Found',
    message: 'This page isn’t part of your admin workspace.',
    redirect: '/junior_admin/',
    cta: 'Go to Dashboard',
  },
  branch_admin: {
    label: 'Page Not Found',
    message: 'This page isn’t available within the teaching panel.',
    redirect: '/teacher/',
    cta: 'Go to Teaching Panel',
  },
  shop_admin: {
    label: 'Page Not Found',
    message: 'This page doesn’t exist in your student area.',
    redirect: '/student/',
    cta: 'Go to My Classes',
  },
   staff: {
    label: 'Page Not Found',
    message: 'This page doesn’t exist in your student area.',
    redirect: '/student/',
    cta: 'Go to My Classes',
  },
};

export default function InsiderNotFound() {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const config = roleConfig[role];

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="w-full max-w-5xl text-center shadow-lg">
        <CardContent className="py-10 space-y-6">
          <div>
            {}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1 text-xs font-medium text-destructive">
                <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                {config.label}
              </span>
            </div>

            {}
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl opacity-70" />
              <img
                src={unserviceableImg}
                alt="Restricted access"
                className="relative mx-auto w-60 max-w-full"
              />
            </div>

            {}
            <h1 className="text-5xl font-bold tracking-tight">404</h1>

            {}
            <p className="text-sm text-muted-foreground leading-relaxed px-8">{config.message}</p>

            {}
            <div className="mx-auto h-px w-24 bg-border" />

            {}
            <p className="text-xs text-muted-foreground">
              Nothing is broken. You can continue safely from your dashboard.
            </p>

            {}
            <Link to={config.redirect} className="w-full max-w-md space-y-10 mx-auto block">
  <Button className="w-full mt-6 text-white">
    {config.cta}
  </Button>
</Link>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
