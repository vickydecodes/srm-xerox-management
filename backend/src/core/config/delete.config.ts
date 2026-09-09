import mongoose from 'mongoose';

export interface DependencyConfig {
  modelName: string;
  filterField: string;
  name: string;
}

export interface EntityDeleteConfig {
  dependencies: DependencyConfig[];
}

export const DeleteConfig: Record<string, EntityDeleteConfig> = {
  department: {
    dependencies: [
      { modelName: 'Bill', filterField: 'department', name: 'Bills' },
      { modelName: 'CreditPayment', filterField: 'department', name: 'Credits' },
      { modelName: 'User', filterField: 'department', name: 'Users' },
    ],
  },
  branch: {
    dependencies: [
      { modelName: 'Department', filterField: 'branch', name: 'Departments' },
      { modelName: 'User', filterField: 'branch', name: 'Users' },
    ],
  },
};
