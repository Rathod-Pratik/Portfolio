import { FetchStates, IncrementView } from './Stats.controller.ts';
import { checkAdminCookie } from '../../middlewares/Auth.middleware.ts';

import express from "express";

const routes = express.Router();

routes.get("/", checkAdminCookie, FetchStates);
routes.put("/view", IncrementView);

export default routes;
