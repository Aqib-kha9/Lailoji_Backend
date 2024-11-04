import express from "express";
import {
  addFlashDeal,
  getAllFlashDeals,
  updatePublishedStatus,
  updateFlashDeal,
  deleteFlashDeal,
  getFlashDealById,
  addProductsToAflashDeal,
  removeProductFromFlashDeal,
} from "../controllers/flashDeal.js";
import { uploadFlashDealImage } from "../middleware/flashDealsImage.js";

const router = express.Router();

router.post("/", uploadFlashDealImage, addFlashDeal);
router.put("/:id", uploadFlashDealImage, updateFlashDeal);
router.get("/", getAllFlashDeals);

router.put("/:id/status", updatePublishedStatus);

router.delete("/:id", deleteFlashDeal);

router.get("/:id", getFlashDealById);

// add products to a flash deal
router.post("/:id", addProductsToAflashDeal);

// removeProductFromFlashDeal
router.delete(
  "/:flashDealId/remove-product/:productId",
  removeProductFromFlashDeal
);

export default router;
