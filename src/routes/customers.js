import express from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer } from '../controllers/customerController.js';

const router = express.Router();

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

export default router; 