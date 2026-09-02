import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth.context';

export const useAction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hasReceiver = useRef(false);
  const handlersRef = useRef({});
  const consumedActionRef = useRef(null);

  const resolvePath = (path) => `/${user.role}/${path}`;





  const navigateWith = (unfilteredpath) => {
    const path = resolvePath(unfilteredpath);

    return {
      trigger: (type, payload = null) =>
        navigate(path, { state: { type, payload } }),
      create: (payload = null) =>
        navigate(path, { state: { type: 'create', payload } }),
      edit: (payload = null) =>
        navigate(path, { state: { type: 'edit', payload } }),
      delete: (payload = null) =>
        navigate(path, { state: { type: 'delete', payload } }),
      view: (payload = null) =>
        navigate(path, { state: { type: 'view', payload } }),
    };
  };

  const usePageAction = (handlers = {}) => {
    hasReceiver.current = true;
    handlersRef.current = handlers;


    useEffect(() => {
      if (!consumedActionRef.current && location.state?.type) {
        consumedActionRef.current = {
          type: location.state.type,
          payload: location.state.payload,
        };

        navigate(location.pathname, { replace: true });
      }
    }, [location.state, location.pathname, navigate]);

    useEffect(() => {
      const action = consumedActionRef.current;
      if (!action) return;

      const fn = handlersRef.current[action.type];
      if (!fn) return;


      fn(action.payload);


      consumedActionRef.current = null;
    }, []);
  };

  useEffect(() => {
    const action = location.state?.type;
    if (action && !hasReceiver.current) {
      navigate(location.pathname, { replace: true });
    }
  }, []);

  return { navigateWith, usePageAction };
};
