import { IconKey, IconLogout2 } from "@tabler/icons-react";
import ChangePassword from "@/pages/changepassword/changepassword";

export const departmentAdminRoutes = {
  role: "department_admin",
  routes: [
    {
      path: "/department_admin/changepassword",
      label: "Change Password",
      title: "Change Password",
      description: "Update your administrator password",
      element: <ChangePassword />,
      icon: <IconKey className="h-5 w-5 shrink-0" />,
    },
  ],
  logout: {
    label: "Logout",
    title: "Logout",
    description: "Sign out of your administrator account.",
    icon: <IconLogout2 className="h-5 w-5 shrink-0" />,
    path: "/",
  },
};
