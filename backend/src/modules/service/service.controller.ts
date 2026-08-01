import { Request, Response } from "express";

import * as service from "./service.service.ts";

import {
    CreateServicePayload,
    UpdateServicePayload,
} from "@typings/service.types.ts";
import { createStatusControllers } from "@core/constants/createstatuscontroller.constant.ts";
import sendResponse from "@core/constants/responsewrapper.constant.ts";
import { buildQuery } from "@core/constants/querybuilder.constant.ts";
import { wrapControllers } from "@core/constants/wrapcontroller.constant.ts";

const serviceStatus = createStatusControllers(
    {
        remove: service.removeService,
        setActiveStatus: service.setServiceActiveStatus,
        retrieve: service.retrieveService,
    },
    "service"
);

const controllers = {
    createService: async (
        req: Request<{}, {}, CreateServicePayload>,
        res: Response
    ) => {
        const createdService = await service.createService(req.body);

        return sendResponse.created(
            res,
            "Service",
            createdService
        );
    },

    getAllServices: async (
        req: Request,
        res: Response
    ) => {
        const queries = buildQuery(req);

        const result = await service.getAllServices(
            queries,
            "super_admin"
        );

        return sendResponse.paginated(
            res,
            "service",
            result
        );
    },

    getServiceById: async (
        req: Request<{ id: string }>,
        res: Response
    ) => {
        const { id } = req.params;

        const foundService =
            await service.getServiceById(id);

        if (!foundService)
            return sendResponse.notFound(
                res,
                "service"
            );

        return sendResponse.fetched(
            res,
            "service",
            foundService
        );
    },

    updateService: async (
        req: Request<
            { id: string },
            {},
            UpdateServicePayload
        >,
        res: Response
    ) => {
        const { id } = req.params;

        const updatedService =
            await service.updateService(
                id,
                req.body
            );

        if (!updatedService)
            return sendResponse.notFound(
                res,
                "service"
            );

        return sendResponse.updated(
            res,
            "service",
            updatedService
        );
    },

    deleteService: serviceStatus.softDelete,

    setServiceActiveStatus:
        serviceStatus.setActiveStatus,

    retrieveService:
        serviceStatus.retrieve,

    eraseService: async (
        req: Request<{ id: string }>,
        res: Response
    ) => {
        const { id } = req.params;

        const erasedService =
            await service.eraseService(id);

        if (!erasedService)
            return sendResponse.notFound(
                res,
                "service"
            );

        return sendResponse.deleted(
            res,
            "service"
        );
    },
};

export const {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    setServiceActiveStatus,
    retrieveService,
    eraseService,
} = wrapControllers(controllers);