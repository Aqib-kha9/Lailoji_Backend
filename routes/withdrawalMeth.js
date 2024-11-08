import express from "express";
import { addWithdrawalMethod,getAllWithdrawalMethods,updateWithdrawalMethod,updateWithdrawalMethodStatus,deleteWithdrawalMethod } from "../controllers/withdrawalMeth.js";

const router = express.Router();

router.post("/", addWithdrawalMethod);

// Route to get all withdrawal methods
router.get("/", getAllWithdrawalMethods);

// Route to update a withdrawal method
router.put('/:methodId', updateWithdrawalMethod);

// PUT request to update the 'isActive' or 'isDefault' field of a method
router.put('/:id/status', updateWithdrawalMethodStatus);

// Express route to delete a withdrawal method
router.delete('/:id', deleteWithdrawalMethod);

export default router;
