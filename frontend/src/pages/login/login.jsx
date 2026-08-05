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
  Printer,
  ScanLine,
  ArrowRight,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/core/contexts/auth.context';
import { Link, useNavigate } from 'react-router-dom';
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
  };

  return (
    <div className="min-h-[100svh] grid lg:grid-cols-2 xrx-shell">
      {/* LEFT: scanner panel */}
      <div className="hidden lg:flex flex-col bg-[#14161A] text-[#F1F3F4] relative overflow-hidden">
        <div className="xrx-grid" />

        <div className="relative flex-1 flex flex-col justify-center p-12 xl:p-20">
          <div className="max-w-xl">
            <div className="flex items-center gap-5 mb-12">
              <div className="w-16 h-16 rounded-md bg-[#0F8B8D]/15 border border-[#0F8B8D]/40 flex items-center justify-center">
                <Printer className="h-8 w-8 text-[#2FD4D7]" />
              </div>
              <div>
                <p className="xrx-mono text-xs tracking-[0.3em] text-[#2FD4D7] mb-1">
                  SRM · SERVICE DESK
                </p>
                <h1 className="text-4xl text-white font-bold tracking-tight">
                  Xerox Management
                </h1>
              </div>
            </div>

            {/* Scanner document stack + sweeping scan bar */}
            <div className="xrx-scanner mb-10">
              <div className="xrx-sheet xrx-sheet-3" />
              <div className="xrx-sheet xrx-sheet-2" />
              <div className="xrx-sheet xrx-sheet-1">
                <div className="xrx-sheet-lines">
                  <span /><span /><span /><span /><span />
                </div>
                <div className="xrx-scanbar" />
              </div>
            </div>

            <p className="text-lg leading-relaxed text-[#B9BEC2]">
              Track print jobs, manage copy counters and settle counter
              billing for every order that crosses the desk — from a
              single job ticket to a full binding batch.
            </p>

            <div className="flex items-center gap-3 mt-8 text-[#7C8288]">
              <ScanLine className="h-4 w-4 text-[#2FD4D7]" />
             
            </div>
          </div>
        </div>

        <div className="relative px-12 pb-10 xrx-mono text-[11px] tracking-wide text-[#5C6167]">
          © {new Date().getFullYear()} SRM XEROX MANAGEMENT SYSTEM
        </div>
      </div>

      {/* RIGHT: counter ticket login */}
      <div className="flex min-h-[100svh] items-center justify-center px-4 py-6 sm:px-6 bg-[#F1F3F4]">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile header */}
          <div className="text-center lg:hidden">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-[#14161A] text-[#2FD4D7]">
              <Printer className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Xerox Management
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to the service counter
            </p>
          </div>

          <Card className="border-0 shadow-xl xrx-ticket">
            <CardHeader className="pb-4 space-y-2">
             
              <CardTitle className="text-2xl font-bold">
                Counter Sign-in
              </CardTitle>
              <CardDescription className="text-sm">
                Enter your staff login ID and password
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="loginId" className="text-sm font-medium">
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
                    className="h-11 sm:h-12 text-sm sm:text-base"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">
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
                      className="h-11 sm:h-12 pr-11 text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#0F8B8D]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center py-3">
                    <Checkbox
                      id="rememberMe"
                      className="me-3 ms-2"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Keep this counter signed in
                    </Label>
                  </div>
                </div>

                {ErrorAlert}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !loginId.trim() || !password}
                  className="h-11 sm:h-12 w-full text-sm sm:text-base font-semibold bg-[#14161A] hover:bg-[#0F8B8D] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Open Counter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-1 text-center xrx-ticket-tear">
              <p className="text-xs sm:text-sm text-muted-foreground pt-4">
                Need a login for your branch?
              </p>
              <Link
                to="/enquiry"
                className="inline-flex items-center gap-1.5 text-sm text-[#0F8B8D] hover:underline"
              >
                Request access
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}