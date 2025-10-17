const express = require("express");
const multer = require("multer");
const { MongoClient, GridFSBucket } = require("mongodb");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB config
const mongoURL = process.env.MONGO_URL || "mongodb+srv://Namachivayan:Rolex123@mycluster.hmrasie.mongodb.net/?retryWrites=true&w=majority&appName=MyCluster";
const client = new MongoClient(mongoURL);
let bucket;

// Middleware for parsing multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve index.html at root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

async function start() {
    await client.connect();
    const db = client.db("myDB");
    bucket = new GridFSBucket(db, { bucketName: "uploads" });
    console.log("Connected to MongoDB!");

    // Upload file
    app.post("/upload", upload.single("file"), (req, res) => {
        if (!req.file) return res.status(400).send("No file uploaded");

        const stream = bucket.openUploadStream(req.file.originalname);
        stream.end(req.file.buffer);

        stream.on("finish", () => res.send("File uploaded successfully!"));
        stream.on("error", (err) => {
            console.error(err);
            res.status(500).send("Error uploading file");
        });
    });

    // List files
    app.get("/files", async (req, res) => {
        const files = await db.collection("uploads.files").find({}).toArray();
        res.json(files.map(f => f.filename));
    });

    // Download file
    app.get("/files/:filename", (req, res) => {
        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
        downloadStream.on("error", () => res.status(404).send("File not found"));
        downloadStream.pipe(res);
    });

    // Delete file
    app.delete("/delete/:filename", async (req, res) => {
        const file = await db.collection("uploads.files").findOne({ filename: req.params.filename });
        if (!file) return res.status(404).send("File not found");

        bucket.delete(file._id, (err) => {
            if (err) return res.status(500).send("Error deleting file");
            res.send("File deleted successfully!");
        });
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => console.error(err));
