const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");

// Upload file
async function uploadFile() {
    if (!fileInput.files.length) return alert("Select a file!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    alert(await res.text());
    fileInput.value = ""; // clear input
    listFiles(); // refresh list
}

// List files
async function listFiles() {
    const res = await fetch("/files");
    const files = await res.json();

    fileList.innerHTML = "";

    files.forEach(filename => {
        const li = document.createElement("li");
        li.textContent = filename;

        // Download link
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "Download";
        downloadBtn.onclick = () => window.open(`/files/${filename}`, "_blank");

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = async () => {
            if (confirm(`Delete ${filename}?`)) {
                const res = await fetch(`/delete/${filename}`, { method: "DELETE" });
                alert(await res.text());
                listFiles(); // refresh list
            }
        };

        li.appendChild(downloadBtn);
        li.appendChild(deleteBtn);
        fileList.appendChild(li);
    });
}

// Initial load
listFiles();
