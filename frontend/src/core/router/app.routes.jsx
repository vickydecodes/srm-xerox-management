// AppRoutes.jsx
import { Route, Routes } from 'react-router-dom';
import { appRoutes } from './routes.jsx';
import Layout from '@/components/global/layout.jsx';

export default function AppRoutes() {
    return (
        <Routes>
            <Route
                element={
                    <Layout
                        routes={appRoutes}
                        logoutComponent={{ label: 'Logout', path: '#' }}
                    />
                }
            >
                {appRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
            </Route>
        </Routes>
    );
}