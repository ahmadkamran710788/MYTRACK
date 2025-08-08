// src/routes/index.ts
import express from "express";
// import continentRoutes from "./continents";
import contactRoutes from "./contact"
import callBackRoutes from "./callBack"
import orderRoutes from "./order"

const router = express.Router();

router.use("/package", contactRoutes);
router.use("/callback", callBackRoutes)
router.use("/order", orderRoutes)
export default router;
