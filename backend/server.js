import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import questionRoutes from "./routes/questionRoutes.js";
import frqRoutes from "./routes/frqRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import studyPlanRoutes from "./routes/studyPlanRoutes.js";
import practiceTestRoutes from "./routes/practiceTestRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import { initializeCedParsing } from "./services/cedParser.js";

dotenv.config();
const app = express();

// CORS — IMPORTANT: Allow Vercel frontend URL
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    // Your deployed frontend domain:
    "https://your-frontend.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

// Simple test route
app.get("/", (req, res) => {
  res.send("High5 backend is running 👑");
});

// API routes
app.use("/api/questions", questionRoutes);
app.use("/api/frq", frqRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/study-plan", studyPlanRoutes);
app.use("/api/practice-test", practiceTestRoutes);
app.use("/api/flashcards", flashcardRoutes);

/* 
  IMPORTANT FOR VERCEL:
  Serverless functions cannot run heavy startup tasks every request.
  So we run initializeCedParsing() ONLY in local development.
*/

// Local development only
async function startLocalServer() {
  try {
    console.log("Starting High5 backend locally...");

    await initializeCedParsing();

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running locally on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting local server:", error);
    process.exit(1);
  }
}

// Only start server if running "node server.js"
if (process.env.VERCEL !== "1") {
  startLocalServer();
}

// Export for Vercel serverless function
export default app;
