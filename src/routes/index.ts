// src/routes/index.ts
import express from "express";
// import continentRoutes from "./continents";
import contactRoutes from "./contact"

const router = express.Router();

router.use("/package ", contactRoutes);
export default router;
