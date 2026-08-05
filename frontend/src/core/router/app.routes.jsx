
import { Route, Routes } from 'react-router-dom';
import Layout from '@/components/global/layout.jsx';
import { adminRoutes } from './admin.routes.jsx';
import { branchAdminRoutes } from './branch.routes.jsx';
import { departmentAdminRoutes } from './department.routes.jsx';
import { shopAdminRoutes } from './shop.routes.jsx';
import { staffRoutes } from './staff.routes.jsx';
import { getRelativePath } from '../utils/helper.utils.jsx';
import ProtectedRoute from './protected.route.jsx';
import InsiderNotFound from '@/components/global/app404.jsx';
import PublicNotFound from '@/components/global/notfound.jsx';
import Login from '@/pages/login/login.jsx';
import PublicRoute from './public.route.jsx';


const roleRouteGroups = [
    adminRoutes,
    branchAdminRoutes,
    departmentAdminRoutes,
    shopAdminRoutes,
    staffRoutes,
];

export default function AppRoutes() {
    return (
        <Routes>
            {roleRouteGroups.map((group) => (
                <Route key={group.role} element={<ProtectedRoute allowedRoles={[group.role]} />}>
                    <Route
                        path={`/${group.role}/*`}
                        element={<Layout routes={group.routes} logoutComponent={group.logout} />}
                    >
                        {group.routes.map((route, index) => {
                            const basePath = `/${group.role}`;
                            const isIndex = route.path === basePath || route.path === `${basePath}/`;
                            return (
                                <Route
                                    key={index}
                                    {...(isIndex ? { index: true } : { path: getRelativePath(route.path, basePath) })}
                                    element={
                                        <ProtectedRoute allowedRoles={[group.role]}>
                                            {route.element}
                                        </ProtectedRoute>
                                    }
                                />
                            );
                        })}
                        <Route path="*" element={<InsiderNotFound />} />
                    </Route>
                </Route>
            ))}

            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="*" element={<PublicNotFound />} />
        </Routes>
    );
}