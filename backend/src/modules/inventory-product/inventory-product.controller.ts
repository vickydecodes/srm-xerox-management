import { Request, Response } from "express";
import * as service from "./inventory-product.service.ts";
import { extractBranch } from "./inventory-product.constants.ts";
import {
    CreateInventoryProductPayload,
    UpdateInventoryProductPayload,
} from "@typings/inventory.types.ts";
import { createStatusControllers } from "@core/constants/createstatuscontroller.constant.ts";
import sendResponse from "@core/constants/responsewrapper.constant.ts";
import { buildQuery } from "@core/constants/querybuilder.constant.ts";
import { wrapControllers } from "@core/constants/wrapcontroller.constant.ts";

const inventoryProductStatus = createStatusControllers(
    {
        remove: service.removeInventoryProduct,
        setActiveStatus: service.setInventoryProductActiveStatus,
        retrieve: service.retrieveInventoryProduct,
    },
    "inventory product"
);


const controllers = {
    createInventoryProduct: async (
        req: Request<{}, {}, CreateInventoryProductPayload>,
        res: Response
    ) => {
        const inventoryProduct =
            await service.createInventoryProduct(req.body);

        return sendResponse.created(
            res,
            "Inventory Product",
            inventoryProduct
        );
    },

    getAllInventoryProducts: async (
    req: Request,
    res: Response
) => {
    const queries = buildQuery(req);
    const inventory = extractBranch(queries);

    const result =
        await service.getAllInventoryProducts(
            queries,
            "super_admin",
            {
                inventoryId: inventory,
            }
        );

    return sendResponse.paginated(
        res,
        "inventory product",
        result
    );
},


getInventoryProductById: async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const { id } = req.params;

    const inventoryProduct =
        await service.getInventoryProductById(id);

    if (!inventoryProduct)
        return sendResponse.notFound(
            res,
            "inventory product"
        );

    return sendResponse.fetched(
        res,
        "inventory product",
        inventoryProduct
    );
},

updateInventoryProduct: async (
    req: Request<
        { id: string },
        {},
        UpdateInventoryProductPayload
    >,
    res: Response
) => {
    const { id } = req.params;

    const inventoryProduct =
        await service.updateInventoryProduct(
            id,
            req.body
        );

    if (!inventoryProduct)
        return sendResponse.notFound(
            res,
            "inventory product"
        );

    return sendResponse.updated(
        res,
        "inventory product",
        inventoryProduct
    );
},

deleteInventoryProduct:
    inventoryProductStatus.softDelete,

setInventoryProductActiveStatus:
    inventoryProductStatus.setActiveStatus,

retrieveInventoryProduct:
    inventoryProductStatus.retrieve,

eraseInventoryProduct: async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const { id } = req.params;

    const inventoryProduct =
        await service.eraseInventoryProduct(id);

    if (!inventoryProduct)
        return sendResponse.notFound(
            res,
            "inventory product"
        );

    return sendResponse.deleted(
        res,
        "inventory product"
    );
},

};

export const {
    createInventoryProduct,
    getAllInventoryProducts,
    getInventoryProductById,
    updateInventoryProduct,
    deleteInventoryProduct,
    setInventoryProductActiveStatus,
    retrieveInventoryProduct,
    eraseInventoryProduct,
} = wrapControllers(controllers);