/**
 * tests/contexts/ui.context.test.jsx
 *
 * UIProvider depends on useAuth() (for role-derived commands and the
 * logout action) and on several UI primitives (Dialog, AlertDialog*,
 * ScrollArea). Those primitives are mocked as minimal interactive
 * stand-ins so the actual modal-stack/alert logic can be exercised via
 * real clicks rather than reaching into internals.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import { UIProvider, useUI } from '@/core/contexts/ui.context';
import { toast } from 'sonner';
import { uiRef } from '@/core/bridge/ui.ref';

const { mockLogout, mockUseAuth } = vi.hoisted(() => {
  const mockLogout = vi.fn().mockResolvedValue();
  return {
    mockLogout,
    mockUseAuth: vi.fn(() => ({ user: { role: 'super_admin' }, logout: mockLogout })),
  };
});

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/core/router/admin.routes', () => ({
  adminRoutes: { routes: ['route-a', 'route-b'] },
}));

vi.mock('@/core/bridge/ui.ref', () => ({
  uiRef: {},
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }) =>
    open ? (
      <div data-testid="dialog">
        {children}
        <button onClick={() => onOpenChange(false)}>overlay-close</button>
      </div>
    ) : null,
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

const ModalA = ({ closeModal, onClose: _onClose, label }) => (
  <div data-testid="modal-a">
    {label || 'Modal A'}
    <button onClick={closeModal}>close-a</button>
  </div>
);
const ModalB = ({ closeModal }) => (
  <div data-testid="modal-b">
    Modal B
    <button onClick={closeModal}>close-b</button>
  </div>
);

function TestConsumer() {
  const ui = useUI();
  return (
    <div>
      <div data-testid="commands-count">{ui.commands.length}</div>
      <div data-testid="sidebar-open">{String(ui.sidebarOpen)}</div>
      <button onClick={() => ui.openModal(ModalA)}>open-a</button>
      <button onClick={() => ui.openModal({ component: ModalB })}>open-b</button>
      <button onClick={() => ui.openModal('not-a-component')}>open-invalid</button>
      <button onClick={() => ui.openModal(ModalA, { onClose: window.__onCloseSpy })}>open-a-with-onclose</button>
      <button onClick={() => ui.closeModal()}>close-top</button>
      <button onClick={() => ui.setOpenLogout(true)}>open-logout</button>
    </div>
  );
}

const renderUI = () => render(<UIProvider><TestConsumer /></UIProvider>);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { role: 'super_admin' }, logout: mockLogout });
});

describe('UIProvider — role-derived commands', () => {
  test('super_admin gets the admin route list as commands', () => {
    renderUI();
    expect(screen.getByTestId('commands-count')).toHaveTextContent('2');
  });

  test('a role with no command mapping gets an empty command list', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'staff' }, logout: mockLogout });
    renderUI();
    expect(screen.getByTestId('commands-count')).toHaveTextContent('0');
  });

  test('no user (logged out) gets an empty command list, not a crash', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: mockLogout });
    renderUI();
    expect(screen.getByTestId('commands-count')).toHaveTextContent('0');
  });
});

describe('UIProvider — openModal', () => {
  test('accepts a bare function component and renders it in a dialog', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-a'));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('modal-a')).toBeInTheDocument();
  });

  test('accepts the { component } object form', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-b'));
    expect(screen.getByTestId('modal-b')).toBeInTheDocument();
  });

  test('rejects an invalid type with a toast and renders no dialog', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-invalid'));
    expect(toast.error).toHaveBeenCalledWith('Invalid modal type: expected a component.');
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  test('stacks multiple modals independently', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-a'));
    fireEvent.click(screen.getByText('open-b'));
    expect(screen.getAllByTestId('dialog')).toHaveLength(2);
    expect(screen.getByTestId('modal-a')).toBeInTheDocument();
    expect(screen.getByTestId('modal-b')).toBeInTheDocument();
  });
});

describe('UIProvider — closing modals', () => {
  test('a modal\'s own closeModal prop removes only that modal', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-a'));
    fireEvent.click(screen.getByText('open-b'));

    fireEvent.click(within(screen.getByTestId('modal-a')).getByText('close-a'));

    expect(screen.queryByTestId('modal-a')).not.toBeInTheDocument();
    expect(screen.getByTestId('modal-b')).toBeInTheDocument();
  });

  test('closeModal() (no id) closes only the topmost modal', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-a')); // opened first (bottom)
    fireEvent.click(screen.getByText('open-b')); // opened second (top)

    fireEvent.click(screen.getByText('close-top'));

    expect(screen.getByTestId('modal-a')).toBeInTheDocument();
    expect(screen.queryByTestId('modal-b')).not.toBeInTheDocument();
  });

  test("Dialog's onOpenChange(false) — e.g. overlay click/ESC — closes that modal too", () => {
    renderUI();
    fireEvent.click(screen.getByText('open-a'));
    fireEvent.click(screen.getByText('overlay-close'));
    expect(screen.queryByTestId('modal-a')).not.toBeInTheDocument();
  });

  test('calls onClose from the modal props when it is closed', () => {
    window.__onCloseSpy = vi.fn();
    renderUI();
    fireEvent.click(screen.getByText('open-a-with-onclose'));
    fireEvent.click(screen.getByText('close-a'));
    expect(window.__onCloseSpy).toHaveBeenCalled();
    delete window.__onCloseSpy;
  });

  test('uiRef.clearModals empties the entire stack at once', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-a'));
    fireEvent.click(screen.getByText('open-b'));
    expect(screen.getAllByTestId('dialog')).toHaveLength(2);

    // The provider assigns its clearModals implementation onto the shared
    // uiRef bridge object at render time — this is how other parts of the
    // app (e.g. the 401 interceptor in auth.context.jsx) trigger it.
    expect(typeof uiRef.clearModals).toBe('function');

    act(() => {
      uiRef.clearModals();
    });
    expect(screen.queryAllByTestId('dialog')).toHaveLength(0);
  });
});

describe('UIProvider — logout confirmation dialog', () => {
  test('setOpenLogout(true) shows the confirmation dialog', () => {
    renderUI();
    fireEvent.click(screen.getByText('open-logout'));
    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
    expect(screen.getByText('Log out of your account?')).toBeInTheDocument();
  });

  test('confirming logout calls auth.logout() and closes the dialog', async () => {
    renderUI();
    fireEvent.click(screen.getByText('open-logout'));
    fireEvent.click(screen.getByText('Logout'));

    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument());
  });
});

describe('useUI — outside provider (dev fallback)', () => {
  test('returns safe no-op defaults and warns, instead of throwing, in dev', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const BadConsumer = () => {
      const ui = useUI();
      return (
        <div>
          <div data-testid="fallback-sidebar">{String(ui.sidebarOpen)}</div>
          <button onClick={() => ui.openModal(ModalA)}>open</button>
        </div>
      );
    };

    render(<BadConsumer />);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[useUI]'));
    expect(screen.getByTestId('fallback-sidebar')).toHaveTextContent('false');
    // the fallback openModal is a no-op — must not throw when clicked
    expect(() => fireEvent.click(screen.getByText('open'))).not.toThrow();
  });
});