


import { useContext, createContext, useState, useCallback, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { uiRef } from '@/core/bridge/ui.ref';
import { adminRoutes } from '../router/admin.routes';
import { useAuth } from './auth.context';

const UIContext = createContext();

export const useUI = () => {
    const ctx = useContext(UIContext);
    if (!ctx) {
        if (import.meta.env.DEV) {
            console.warn('[useUI] context missing — HMR boundary, ignoring');
            return {
                setCommandOpen: () => {},
                sidebarOpen: false,
                setSidebarOpen: () => {},
                commandOpen: false,
                commands: [],
                setOpenLogout: () => {},
                openModal: () => {},
                closeModal: () => {},
            };
        }
        throw new Error('useUI must be used inside <UIProvider>');
    }
    return ctx;
};

export const UIProvider = ({ children }) => {
    const [commandOpen, setCommandOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openLogout, setOpenLogout] = useState(false);
    const [modalStack, setModalStack] = useState([]);

   const { user, logout } = useAuth();


     const roleCommands = {
    super_admin: adminRoutes.routes,
    
  };

  const commands = roleCommands[user?.role] || [];

    const idCounter = useRef(0);

    const openModal = useCallback((type, props = {}) => {
        let component;
        if (typeof type === 'function') {
            component = type;
        } else if (typeof type === 'object' && type?.component) {
            component = type.component;
        } else {
            toast.error('Invalid modal type: expected a component.');
            return;
        }
        const id = ++idCounter.current;
        setModalStack((prev) => [...prev, { id, component, props }]);
        return id;
    }, []);

    const closeModalById = useCallback((id) => {
        setModalStack((prev) => {
            const target = prev.find((m) => m.id === id);
            if (target?.props?.onClose) target.props.onClose();
            return prev.filter((m) => m.id !== id);
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalStack((prev) => {
            if (!prev.length) return prev;
            const top = prev[prev.length - 1];
            if (top.props?.onClose) top.props.onClose();
            return prev.slice(0, -1);
        });
    }, []);

    const clearModals = useCallback(() => {
        setModalStack([]);
    }, []);

    uiRef.clearModals = clearModals;

    const ModalStackRenderer = () =>
        modalStack.map((modal) => {
            const ModalContent = modal.component;
            const safeProps = modal.props && typeof modal.props === 'object' ? modal.props : {};

            if (ModalContent.fullscreen) {
                return (
                    <ModalContent
                        key={modal.id}
                        {...safeProps}
                        closeModal={() => closeModalById(modal.id)}
                    />
                );
            }

            return (
                <Dialog
                    key={modal.id}
                    open
                    onOpenChange={(open) => {
                        if (!open) closeModalById(modal.id);
                    }}
                >
                    <ScrollArea>
                        <ModalContent {...safeProps} closeModal={() => closeModalById(modal.id)} />
                    </ScrollArea>
                </Dialog>
            );
        });

    const AlertRenderer = () => {
        return (
            <AlertDialog open={openLogout} onOpenChange={setOpenLogout}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log out of your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will securely end your admin session.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                                await logout();
                                setOpenLogout(false);
                            }}
                        >
                            Logout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    };

    const value = {
        setCommandOpen,
        sidebarOpen,
        setSidebarOpen,
        commandOpen,
        commands,
        openModal,
        closeModal,
        setOpenLogout,
        openLogout,
        role: user?.role
    };

    return (
        <UIContext.Provider value={value}>
            {children}
            <ModalStackRenderer />
            <AlertRenderer />
        </UIContext.Provider>
    );
};