// src/routes/index.ts
import express from "express";
// import continentRoutes from "./continents";
import contactRoutes from "./contact"
import callBackRoutes from "./callBack"

const router = express.Router();

router.use("/package", contactRoutes);
router.use("/callback", callBackRoutes)
export default router;
