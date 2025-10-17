const express = require("express");
const multer = require("multer");
const { MongoClient, ObjectId, GridFSBucket } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;

// MongoDB config
const mongoURL = "mongodb+srv://Namachivayan:Rolex123@mycluster.hmrasie.mongodb.net/?retryWrites=true&w=majority&appName=MyCluster";
const client = new MongoClient(mongoURL);
let bucket;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function start() {
    await client.connect();
    const db = client.db("myDB");
    bucket = new GridFSBucket(db, { bucketName: "uploads" });
    console.log("Connected to MongoDB!");

    // CREATE / UPLOAD FILE
    app.post("/upload", upload.single("file"), (req, res) => {
        if (!req.file) return res.status(400).send("No file uploaded");

        const stream = bucket.openUploadStream(req.file.originalname);
        stream.end(req.file.buffer);

        stream.on("finish", () => res.send("File uploaded successfully!"));
        stream.on("error", (err) => res.status(500).send("Error uploading file"));
    });

    // READ / LIST FILES
    app.get("/files", async (req, res) => {
        const files = await db.collection("uploads.files").find({}).toArray();
        res.json(files.map(f => ({ id: f._id, filename: f.filename })));
    });

    // DOWNLOAD FILE
    app.get("/files/download/:id", (req, res) => {
        const fileId = new ObjectId(req.params.id);
        const downloadStream = bucket.openDownloadStream(fileId);

        downloadStream.on("error", () => res.status(404).send("File not found"));
        downloadStream.pipe(res);
    });

    // UPDATE / RENAME FILE
    app.put("/files/:id", async (req, res) => {
        const fileId = new ObjectId(req.params.id);
        const { newName } = req.body;

        const result = await db.collection("uploads.files").updateOne(
            { _id: fileId },
            { $set: { filename: newName } }
        );

        if (result.modifiedCount === 0) return res.status(404).send("File not found");
        res.send("File renamed successfully");
    });

    // DELETE FILE
    app.delete("/files/:id", (req, res) => {
        const fileId = new ObjectId(req.params.id);
        bucket.delete(fileId, (err) => {
            if (err) return res.status(404).send("File not found");
            res.send("File deleted successfully");
        });
    });

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch(err => console.error(err));
