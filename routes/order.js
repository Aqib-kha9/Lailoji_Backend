import express from "express";
import {
  createNewOrder,
  getAllOrders,
  getAllStores,
  getOrderById,
  getAllPendingOrders,
  getAllConfirmOrders,
  getAllPackagingOrders,
  getAllCanceledOrders,
  getAllReturnedOrders,
  getAllDeliveredOrders,
  pendingOrdersExport,
  confirmedOrdersExport,
  packagingOrdersExport,
  canceledOrdersExport,
  returnedOrdersExport,
  deliveredExport,
} from "../controllers/order.js";

const router = express.Router();

// Route for creating a new order
router.post("/", createNewOrder);
router.get("/store", getAllStores);

// Route pendingOrdersExport
router.get("/pending_export", pendingOrdersExport);

// Route confirmedOrdersExport
router.get("/confirmed_export", confirmedOrdersExport);

// Route packagingOrdersExport
router.get("/packaging_export",packagingOrdersExport)

// Route canceledOrdersExport
router.get("/canceled_export",canceledOrdersExport);

// Route returnedOrdersExport
router.get("/returned_export",returnedOrdersExport);

// Route deliveredExport
router.get("/delivered_export",deliveredExport);

router.get("/", getAllOrders);

router.get("/pending", getAllPendingOrders);

// Route getAllConfirmOrders
router.get("/confirmed", getAllConfirmOrders);

// Route getAllPackagingOrders
router.get("/packaging", getAllPackagingOrders);

// Route getAllCanceledOrders
router.get("/canceled",getAllCanceledOrders);

// Route getAllReturnedOrders
router.get("/returned",getAllReturnedOrders);

// Route getAllDeliveredOrders
router.get("/delivered",getAllDeliveredOrders);

router.get("/:id", getOrderById);

export default router;
