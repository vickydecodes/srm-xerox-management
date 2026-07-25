import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const useDevTools = () => {
    const hasShownToast = useRef(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isDevToolsShortcut =
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
                (e.ctrlKey && e.key === "U");

            if (isDevToolsShortcut) {
                e.preventDefault();

                if (!hasShownToast.current) {
                    toast.error("Developer tools are disabled", {
                        duration: 3000,
                    });
                    hasShownToast.current = true;


                    setTimeout(() => {
                        hasShownToast.current = false;
                    }, 5000);
                }
            }
        };

        const handleContextMenu = (e) => {
            e.preventDefault();

            if (!hasShownToast.current) {
                toast.error("Right click is disabled", {
                    duration: 2500,
                });

                hasShownToast.current = true;
                setTimeout(() => {
                    hasShownToast.current = false;
                }, 5000);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);
};
