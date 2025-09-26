// index.js
import express from "express";
import cors from "cors";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- File Upload (multer) ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Supabase Client ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use "service_role" key (not anon key)
);

// --- Upload Endpoint ---
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const fileBuffer = req.file.buffer;
    const fileName = `${Date.now()}-${req.file.originalname}`;

    // Upload to Supabase storage bucket called "tools"
    const { error } = await supabase.storage
      .from("tools")
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
      });

    if (error) throw error;

    // Generate a public URL
    const { data } = supabase.storage.from("tools").getPublicUrl(fileName);

    // Project link (frontend will read this id)
    const projectId = fileName.replace(/\..+$/, ""); // strip extension

    res.json({
      success: true,
      projectId,
      downloadUrl: data.publicUrl,
      message: "File uploaded & wrapped successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading file");
  }
});

// --- Run Server ---
app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
});
