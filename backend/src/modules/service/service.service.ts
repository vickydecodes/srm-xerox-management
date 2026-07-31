import Service from "@db/models/service.model.ts";
import { dynamicFilter } from "@core/constants/dynamicfilter.constant.ts";
import {
    CreateServicePayload,
    UpdateServicePayload,
} from "@typings/service.types.ts";
import { Role } from "@typings/auth.types.js";
import {
    UPDATE_OPTIONS,
    SOFT_DELETE,
    RETRIEVE,
    getVisibility,
} from "./service.constants.ts";
import { enhanceService } from "./service.util.ts";
import { serviceFilterConfig } from "./service.filterconfig.ts";

export const createService = async (data: CreateServicePayload) => {
    const service = await new Service(data).save();
    return enhanceService(service);
};

export const getAllServices = async (
    queries: Record<string, unknown>,
    role?: Role
) => {
    return dynamicFilter(Service, serviceFilterConfig, queries, {
        visibility: getVisibility(role),
    });
};

export const getServiceById = async (id: string) => {
    return Service.findById(id);
};

export const updateService = async (
    id: string,
    data: UpdateServicePayload
) => {
    const updated = await Service.findByIdAndUpdate(
        id,
        data,
        UPDATE_OPTIONS
    );

    if (!updated) return null;

    return enhanceService(updated);
};

export const removeService = async (id: string) => {
    const removed = await Service.findByIdAndUpdate(
        id,
        SOFT_DELETE,
        { new: true }
    );

    if (!removed) return null;

    return enhanceService(removed);
};

export const retrieveService = async (id: string) => {
    const retrieved = await Service.findByIdAndUpdate(
        id,
        RETRIEVE,
        { new: true }
    );

    if (!retrieved) return null;

    return enhanceService(retrieved);
};

export const eraseService = async (id: string) => {
    const erased = await Service.findByIdAndDelete(id);

    if (!erased) return null;

    return enhanceService(erased);
};

export const setServiceActiveStatus = async (
    id: string,
    active: boolean
) => {
    return Service.findByIdAndUpdate(
        id,
        {
            active,
            ...(active
                ? {
                      deleted: false,
                      deletedAt: null,
                  }
                : {}),
        },
        { new: true }
    );
};