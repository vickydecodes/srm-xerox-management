// pages/errors/PublicNotFound.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import unserviceableImg from '/logo.png';

export default function PublicNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-5xl text-center shadow-lg">
        <CardContent className="py-10 space-y-6">
          {/* STATUS BADGE */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
              Page unavailable
            </span>
          </div>

          {/* IMAGE WRAPPER WITH GLOW */}
          <div className="relative mx-auto w-fit">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl opacity-70" />
            <img
              src={unserviceableImg}
              alt="Page unserviceable"
              className="
                relative mx-auto w-60 max-w-full
              "
            />
          </div>

          {/* STATUS */}
          <h1 className="text-5xl font-bold tracking-tight">404</h1>

          {/* MESSAGE */}
          <p className="text-sm text-muted-foreground leading-relaxed px-8">
            This page is currently unavailable.
            <br />
            It may have been moved, renamed, or is temporarily down.
          </p>

          {/* DIVIDER */}
          <div className="mx-auto h-px w-24 bg-border" />

          {/* MICRO REASSURANCE */}
          <p className="text-xs text-muted-foreground">
            You can safely return and continue from there.
          </p>

          {/* CTA */}
          <Link to={'/'} className="w-full max-w-md space-y-10 mx-auto block">
            <Button className="w-full mt-6 text-white">Back to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
