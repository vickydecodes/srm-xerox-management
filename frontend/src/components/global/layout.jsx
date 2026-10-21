'use client';

import { useEffect, useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { CommandMenu } from './globalcommand';
import { Search } from 'lucide-react';
import { useUI } from '@/core/contexts/ui.context';
import { camelToTitle } from '@/core/utils/helper.utils';

/* ---------- Live date & time ---------- */
const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
});

function LiveClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex flex-col items-end text-right leading-tight">
            <span className="text-xl md:text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {timeFormatter.format(now).toUpperCase()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {dateFormatter.format(now)}
            </span>
        </div>
    );
}

export default function Layout({ routes, logoutComponent }) {
    const {
        setCommandOpen,
        role,
        sidebarOpen,
        setOpenLogout,
        setSidebarOpen,
        commandOpen,
        commands,
    } = useUI();

    const location = useLocation();

    const currentRoute =
        routes.find((r) => location.pathname === r.path) || null;

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname, setSidebarOpen]);

    return (
        <div
            className={cn(
                'mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800 h-[100vh]'
            )}
        >
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-1 mt-4 flex-col overflow-x-hidden overflow-y-auto scrollbar-none">
                        {sidebarOpen ? <Logo role={role} /> : <LogoIcon />}

                        <div className="mt-8 flex flex-col gap-2">
                            {routes.filter((route) => !route.hidden).map((route) => (
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

            <CommandMenu
                open={commandOpen}
                setOpen={setCommandOpen}
                commands={
                    commands && commands.length > 0 ? commands : routes
                }
                role={role}
            />

            <div
                className={
                    currentRoute?.title
                        ? 'relative w-full min-h-screen md:p-6 p-4 bg-gray-50 dark:bg-gray-900 overflow-auto scrollbar-none'
                        : 'relative w-full bg-gray-50 dark:bg-gray-900 overflow-auto scrollbar-none'
                }
            >
                {currentRoute?.title && currentRoute?.description && (
                    <div className="flex w-full items-center justify-between gap-6 md:px-2 mb-8 mt-2 pb-6 border-b border-gray-200 dark:border-neutral-700">
                        {/* Left: logo + brand + title + description (takes all available width) */}
                        <div className="flex flex-1 min-w-0 items-center gap-5">
                            <img
                                src="/final_logo.svg"
                                alt="Reffero POS Billing & Inventory Portal"
                                className="h-16 md:h-20 w-auto min-w-[64px] object-contain shrink-0"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-500">
                                        Reffero POS Billing &amp; Inventory Portal
                                    </span>
                                    <span className="text-2xl md:text-3xl font-bold text-gray-300 dark:text-neutral-700">
                                        /
                                    </span>
                                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
                                        {currentRoute.title}
                                    </h1>
                                </div>
                                <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mt-2 max-w-4xl">
                                    {currentRoute.description}
                                </p>
                            </div>
                        </div>

                        {/* Right: live clock + command menu button */}
                        <div className="flex items-center gap-5 shrink-0">
                            <LiveClock />
                            <button
                                onClick={() => setCommandOpen((prev) => !prev)}
                                className="hidden lg:flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 dark:border-neutral-700 text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-neutral-800 hover:text-gray-600 dark:hover:text-gray-300 transition shrink-0"
                                aria-label="Open command menu"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="m-1 md:m-10 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export const Logo = ({ role }) => (
    <SidebarLink
        link={{
            label: `${camelToTitle(role)} Menu`,
            path: `/`,
            icon: (
                <img
                    src="/final_logo.png"
                    alt="Logo"
                    className="h-16 w-16 shrink-0 object-contain"
                />
            ),
        }}
    />
);

export const LogoIcon = () => (
    <Link
        to="#"
        className="relative z-20 flex items-center justify-center py-1"
    >
        <img
            src="/final_logo.png"
            alt="Logo"
            className="h-16 w-16 shrink-0 object-contain"
        />
    </Link>
);