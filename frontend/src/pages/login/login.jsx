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
    <div className="min-h-svh grid lg:grid-cols-2 xrx-shell">
      {}
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
                  SRM · DTP & XEROX
                </p>
                <h1 className="text-4xl text-white font-bold tracking-tight">
                  Management
                </h1>
              </div>
            </div>

            {}
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

      {}
      <div className="flex min-h-svh items-center justify-center px-4 py-6 sm:px-6 bg-gradient-to-br from-background to-muted/30 relative overflow-hidden">
        
        {/* Subtle background blur orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

          <div className="text-center lg:hidden animate-in fade-in zoom-in duration-500 delay-150 fill-mode-both">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-sm bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 border border-primary/10">
              <Printer className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl text-foreground tracking-tight">
              SRM DTP & XEROX Management
            </h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Sign in to the App
            </p>
          </div>

          <Card className="border border-border/60 bg-background/70 backdrop-blur-2xl shadow-2xl shadow-muted-foreground/10 xrx-ticket rounded-sm overflow-hidden">
            <CardHeader className="pb-6 space-y-2 text-center pt-8">
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-sm flex items-center justify-center mb-2">
                <LogIn className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                Sign-in
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Enter your login ID and password
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="loginId" className="text-sm font-semibold text-foreground">
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
                    className="h-12 text-sm sm:text-base bg-background/50 border-input focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all rounded-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">
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
                      className="h-12 pr-11 text-sm sm:text-base bg-background/50 border-input focus:bg-background focus:ring-2 focus:ring-primary/30 transition-all rounded-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
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
                      className="me-3 ms-1 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-medium text-foreground cursor-pointer select-none"
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
                  className="h-12 w-full text-base font-semibold bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-300 rounded-sm group"
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

            <CardFooter className="flex flex-col space-y-1 text-center xrx-ticket-tear px-8 pb-8">
              <p className="text-xs text-muted-foreground pt-4 leading-relaxed">
                Streamlining campus print operations and billing with seamless efficiency.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}