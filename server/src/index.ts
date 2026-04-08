import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routinesRoutes from "./routes/routines.routes";
import clientsRoutes from "./routes/clients.routes";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../.env.local" });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/routines", routinesRoutes);
app.use("/api/clients", clientsRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Express backend is running securely" });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
