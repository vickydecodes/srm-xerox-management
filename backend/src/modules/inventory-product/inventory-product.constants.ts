import { Types } from "mongoose"
import { Role } from '@typings/auth.types.js';

const ROLE = { SUPER_ADMIN: 'super_admin' } as const;
export const UPDATE_OPTIONS = {
    new: true,
    runValidators: true,
    context: "query"
} as const;

export const SOFT_DELETE = {
    active: false,
};

export const RETRIEVE = {
    active: true,
};

export const extractBranch = (
    queries: Record<string, unknown>
) => {
    const inventory = (queries as Record<string, any>).inventory;

    if (inventory)
        delete (queries as Record<string, any>).inventory;

    return inventory as string | undefined;
};

export const toObjectId = (id: string) => new Types.ObjectId(id);

export const getVisibility = (role?: Role) =>
    role === ROLE.SUPER_ADMIN
        ? "all"
        : "active-only";