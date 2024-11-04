import express from 'express';
import { addDealOfTheDay, getAllDealOfTheDay,updateDealStatus,updateDealOfTheDay,deleteDealOfTheDay } from '../controllers/dealOfTheDay.js';

const router = express.Router();

router.post('/', addDealOfTheDay);

// get all deals of the day
router.get('/',getAllDealOfTheDay);

// Route for updating deal status
router.put('/:id/status', updateDealStatus);

// Route for update deal fields
router.put('/:id',updateDealOfTheDay);

// Route for delete Deal by id 
router.delete('/:id',deleteDealOfTheDay)

export default router;
