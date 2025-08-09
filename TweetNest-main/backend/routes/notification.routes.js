import express from "express";
import { protectRoute } from "../middleware/protextRoute.js";
import { getNotifications } from "../controllers/notification.controller.js";
import { deleteNotification } from "../controllers/notification.controller.js";

const router=express.Router();

router.get("/all",protectRoute,getNotifications);
router.delete("/",protectRoute,deleteNotification);


export default router;