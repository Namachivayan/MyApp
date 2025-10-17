const api = "";

async function uploadFile() {
    const input = document.getElementById("fileInput");
    if (!input.files.length) return alert("Select a file!");

    const formData = new FormData();
    formData.append("file", input.files[0]);

    const res = await fetch(`${api}/upload`, { method: "POST", body: formData });
    alert(await res.text());
    listFiles();
}

async function listFiles() {
    const res = await fetch(`${api}/files`);
    const files = await res.json();
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    files.forEach(f => {
        const li = document.createElement("li");
        li.textContent = f.filename;

        // Download button
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "Download";
        downloadBtn.onclick = () => window.open(`${api}/files/download/${f.id}`, "_blank");

        // Rename button
        const renameBtn = document.createElement("button");
        renameBtn.textContent = "Rename";
        renameBtn.onclick = async () => {
            const newName = prompt("Enter new file name", f.filename);
            if (!newName) return;
            await fetch(`${api}/files/${f.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newName })
            });
            listFiles();
        };

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = async () => {
            if (!confirm("Delete this file?")) return;
            await fetch(`${api}/files/${f.id}`, { method: "DELETE" });
            listFiles();
        };

        li.appendChild(downloadBtn);
        li.appendChild(renameBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

// Initial load
listFiles();
