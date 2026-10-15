'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Loader2,
  LogIn,
  Eye,
  EyeOff,
  ScanLine,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/core/contexts/auth.context';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '@/core/hooks/useAsync';
import './login.css';


export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  
  const { run: runLogin, loading, ErrorAlert } = useAsync(login);

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}/`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) return;

    try {
      await runLogin({ login_id: loginId.trim(), password, rememberMe });
    } catch {
      return;
    }
  }

  return (
    <main className="xrx-login-page">
      <aside className="xrx-brand-panel">
        <div className="xrx-brand-header">
          <div className="xrx-logo-frame">
            <img src="/final_logo.svg" alt="Reffero POS Billing & Inventory Portal" />
          </div>
          <div>
            <p className="xrx-wordmark">Reffero POS Billing & Inventory Portal</p>
            <p className="xrx-brand-caption">Campus print services</p>
          </div>
        </div>

        <div className="xrx-brand-copy">
          <span className="xrx-brand-kicker">Print · Copy · Manage</span>
          <h1>Every print job, in control.</h1>
          <div className="xrx-scanner" aria-hidden="true">
            <div className="xrx-sheet xrx-sheet-3" />
            <div className="xrx-sheet xrx-sheet-2" />
            <div className="xrx-sheet xrx-sheet-1">
              <div className="xrx-sheet-lines">
                <span /><span /><span /><span /><span />
              </div>
              <div className="xrx-scanbar" />
            </div>
          </div>
          <p>
            Track print jobs, manage copy counters, and settle billing from
            one simple workspace built for your campus team.
          </p>
        </div>

        <div className="xrx-brand-footer">
          © {new Date().getFullYear()} Reffero POS Billing & Inventory Portal
        </div>
      </aside>

      <section className="xrx-login-panel">
        <div className="xrx-login-content">
          <div className="xrx-mobile-brand">
            <div className="xrx-logo-frame">
              <img src="/final_logo.svg" alt="SRM Xerox Management logo" />
            </div>
            <div>
              <p className="xrx-wordmark">Reffero POS Billing & Inventory Portal</p>
              <p className="xrx-brand-caption">Campus print services</p>
            </div>
          </div>

          <header className="xrx-login-heading">
            <span className="xrx-login-kicker">
              <ScanLine size={15} aria-hidden="true" />
              Staff portal
            </span>
            <h2>Sign-in to your workspace</h2>
            <p>Use your account details to access print operations.</p>
          </header>

          <Card className="xrx-login-card">
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Enter your login ID and password to continue.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="loginId">
                    Login ID
                  </Label>
                  <Input
                    id="loginId"
                    type="text"
                    placeholder="Enter your login ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      autoComplete="current-password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center pt-2 pb-4">
                    <Checkbox
                      id="rememberMe"
                      className="me-3 ms-1"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="cursor-pointer select-none"
                    >
                      Keep me signed in
                    </Label>
                  </div>
                </div>

                {ErrorAlert}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !loginId.trim() || !password}
                  className="xrx-submit w-full text-base font-semibold group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-1 text-center">
              <p className="leading-relaxed">
                Your campus print operations, together in one place.
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>
    </main>
  );
}