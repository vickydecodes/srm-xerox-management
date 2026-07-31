/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import  { useEffect } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { CommandMenu } from './globalcommand';
import { Search } from 'lucide-react';
import { useUI } from '@/core/contexts/ui.context';

export default function Layout({ routes, logoutComponent }) {
    const { setCommandOpen, sidebarOpen, setOpenLogout, setSidebarOpen, commandOpen } = useUI();
    const location = useLocation();

    const currentRoute = routes.find((r) => location.pathname === r.path) || null;
const commands = routes.map((r) => ({ label: r.label, path: r.path }));
 
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div
            className={cn(
                'mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800 h-[100vh]'
            )}
        >
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
                <SidebarBody
                    className="justify-between gap-10"
                    setcommand={setCommandOpen}
                >
                    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto scrollbar-none">
                        {sidebarOpen ? <Logo /> : <LogoIcon />}
                        <div className="mt-8 flex flex-col gap-2">
                            {/* All routes, flat, no grouping */}
                            {routes.map((route) => (
                                <SidebarLink key={route.path} link={route} />
                            ))}

                            <SidebarLink
                                className="hover:text-destructive"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSidebarOpen(false);
                                    setOpenLogout(true);
                                }}
                                link={logoutComponent}
                            />
                        </div>
                    </div>
                </SidebarBody>
            </Sidebar>

            {commands && commands.length > 0 && (
                <CommandMenu open={commandOpen} setOpen={setCommandOpen} commands={commands} />
            )}

            {/* Main Content */}
            <div
                className={
                    currentRoute?.title
                        ? 'relative w-full min-h-screen md:p-6 p-4 bg-gray-50 dark:bg-gray-900 overflow-auto scrollbar-none'
                        : 'relative w-full  bg-gray-50 dark:bg-gray-900 overflow-auto scrollbar-none'
                }
            >
                {/* Top bar */}
                {currentRoute?.title && currentRoute?.description && (
                    <div className="flex justify-between items-center md:m-[20px] mb-[40px]">
                        <div className="">
                            <h1 className="text-3xl font-bold text-gray-900">{currentRoute.title}</h1>
                            <p className="text-gray-600 mt-2">{currentRoute.description}</p>
                        </div>

                        <button
                            onClick={() => setCommandOpen((prev) => !prev)}
                            className="hidden lg:flex p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                            aria-label="Open command menu"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Main Outlet content */}
                <div className="m-1 md:m-10 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export const Logo = () => (
    <SidebarLink
        link={{
            label: 'Menu',
            path: '#',
            icon: (
                <img
                    src="/logo.png"
                    className="h-10 w-10 transition-all shrink-0 rounded-full object-cover"
                    width={15}
                    height={15}
                    alt="Avatar"
                />
            ),
        }}
    />
);

export const LogoIcon = () => (
    <Link
        to="#"
        className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
        <img
            src="/logo.png"
            className="h-6 w-6 shrink-0 rounded-full object-cover"
            width={6}
            height={6}
            alt="Logo"
        />
    </Link>
);