'use client';

import { useEffect } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { CommandMenu } from './globalcommand';
import { Search } from 'lucide-react';
import { useUI } from '@/core/contexts/ui.context';
import { camelToTitle } from '@/core/utils/helper.utils';

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
                    <div className="flex items-start justify-between md:mx-[20px] mb-8 mt-4 pb-5 border-b border-gray-200 dark:border-neutral-700">
                        <div>
                            {/* Breadcrumb row */}
                            <div className="flex items-center gap-3">
                                <img
                                    src="/logo1.png"
                                    alt="SRM Logo"
                                    className="h-10 w-fit object-contain shrink-0"
                                />
                                <div className='flex flex-col'>
                                    <div className='flex flex-row items-center gap-3'>
                                        <span className="text-sm text-gray-700 dark:text-gray-500">
                                            SRM DTP &amp; Xerox
                                        </span>
                                        <span className="text-gray-300 dark:text-neutral-700">/</span>
                                        <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                                            {currentRoute.title}
                                        </h1>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {currentRoute.description}
                                    </p>
                                </div>
                            </div>

                            {/* Description below */}

                        </div>

                        <button
                            onClick={() => setCommandOpen((prev) => !prev)}
                            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 dark:border-neutral-700 text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-neutral-800 hover:text-gray-600 dark:hover:text-gray-300 transition shrink-0"
                            aria-label="Open command menu"
                        >
                            <Search className="w-4 h-4" />
                        </button>
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
                    src="/logo.png"
                    alt="Logo"
                    className="h-8 w-8 shrink-0 object-contain"
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
            src="/logo.png"
            alt="Logo"
            className="h-8 w-8 shrink-0 object-contain"
        />
    </Link>
);