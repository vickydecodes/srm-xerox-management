import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Import all pages
import Dashboard from '@/pages/dashboard/dashboard';
import Login from '@/pages/login/login';
import Department from '@/pages/department/department';
import Service from '@/pages/service/service';
import Product from '@/pages/product/product';
import Bill from '@/pages/bill/bill';
import Branch from '@/pages/branch/branch';
import BranchAdmin from '@/pages/branch-admin/branch-admin';
import BillCreation from '@/pages/bill-creation/bill-creation';
import InventoryProduct from '@/pages/inventory-product/inventory-product';
import ShopAdmin from '@/pages/shop-admin/shop-admin';
import StaffAdmin from '@/pages/staff-admin/staff-admin';
import DepartmentAdmin from '@/pages/department-admin/department-admin';
import ChangePassword from '@/pages/changepassword/changepassword';
import Profile from '@/pages/profile/profile';
import Order from '@/pages/order/order';
import Credits from '@/pages/credits/credits';
import Settings from '@/pages/settings/settings';
import Shop from '@/pages/shop/shop';

describe('Pages Smoke Tests', () => {
  it('renders Dashboard page successfully', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/Hello/i)).toBeInTheDocument();
  });

  it('renders Login page successfully', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders Department page successfully', () => {
    render(
      <MemoryRouter>
        <Department />
      </MemoryRouter>
    );
    expect(screen.getByText(/Department/i)).toBeInTheDocument();
  });

  it('renders Service page successfully', () => {
    render(
      <MemoryRouter>
        <Service />
      </MemoryRouter>
    );
    expect(screen.getByText(/Service/i)).toBeInTheDocument();
  });

  it('renders Product page successfully', () => {
    render(
      <MemoryRouter>
        <Product />
      </MemoryRouter>
    );
    expect(screen.getByText(/Product/i)).toBeInTheDocument();
  });

  it('renders Bill page successfully', () => {
    render(
      <MemoryRouter>
        <Bill />
      </MemoryRouter>
    );
    expect(screen.getByText(/Bill/i)).toBeInTheDocument();
  });

  it('renders Branch page successfully', () => {
    render(
      <MemoryRouter>
        <Branch />
      </MemoryRouter>
    );
    expect(screen.getByText(/Branch/i)).toBeInTheDocument();
  });

  it('renders BranchAdmin page successfully', () => {
    render(
      <MemoryRouter>
        <BranchAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText(/Branch Admin/i)).toBeInTheDocument();
  });

  it('renders BillCreation page successfully', () => {
    render(
      <MemoryRouter>
        <BillCreation />
      </MemoryRouter>
    );
    expect(screen.getByText(/Create Bill/i)).toBeInTheDocument();
  });

  it('renders InventoryProduct page successfully', () => {
    render(
      <MemoryRouter>
        <InventoryProduct />
      </MemoryRouter>
    );
    expect(screen.getByText(/Inventory/i)).toBeInTheDocument();
  });

  it('renders ShopAdmin page successfully', () => {
    render(
      <MemoryRouter>
        <ShopAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText(/Shop Admin/i)).toBeInTheDocument();
  });

  it('renders StaffAdmin page successfully', () => {
    render(
      <MemoryRouter>
        <StaffAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText(/Staff Admin/i)).toBeInTheDocument();
  });

  it('renders DepartmentAdmin page successfully', () => {
    render(
      <MemoryRouter>
        <DepartmentAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText(/Department Admin/i)).toBeInTheDocument();
  });

  it('renders ChangePassword page successfully', () => {
    render(
      <MemoryRouter>
        <ChangePassword />
      </MemoryRouter>
    );
    expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
  });

  it('renders Profile page successfully', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });

  it('renders Order page successfully', () => {
    render(
      <MemoryRouter>
        <Order />
      </MemoryRouter>
    );
    expect(screen.getByText(/Order/i)).toBeInTheDocument();
  });

  it('renders Credits page successfully', () => {
    render(
      <MemoryRouter>
        <Credits />
      </MemoryRouter>
    );
    expect(screen.getByText(/Credit/i)).toBeInTheDocument();
  });

  it('renders Settings page successfully', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('renders Shop page successfully', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    );
    expect(screen.getByText(/Shop/i)).toBeInTheDocument();
  });
});
