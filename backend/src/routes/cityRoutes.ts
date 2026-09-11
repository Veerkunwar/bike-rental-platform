import { Router } from 'express';
import { listCities } from '../controllers/cityController';

const router = Router();
router.get('/', listCities);
export default router;
