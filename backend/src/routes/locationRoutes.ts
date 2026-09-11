import { Router } from 'express';
import { listLocations } from '../controllers/locationController';

const router = Router();
router.get('/', listLocations);
export default router;
