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

// Allow requests from your frontend only
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"], // frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

// Simple test route
app.get("/", (req, res) => {
  res.send("High5 backend is running 👑");
});

// Mount question routes
app.use("/api/questions", questionRoutes);
app.use("/api/frq", frqRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/study-plan", studyPlanRoutes);
app.use("/api/practice-test", practiceTestRoutes);
app.use("/api/flashcards", flashcardRoutes);

// Initialize CED parsing on startup
async function startServer() {
  try {
    console.log("Starting High5 backend server...");
    
    // Initialize CED parsing
    await initializeCedParsing();
    
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 CED parsing completed`);
      console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/questions`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
