// IndexedDB database setup
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SmartSubtitlesDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('files', { keyPath: 'type' });
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Database error:', event.target.error);
        };
    });
};

const saveFileToDB = (db, type, fileData) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.put({ type, fileData });

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject('Save file error:', event.target.error);
        };
    });
};

document.getElementById('uploadForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const videoFile = document.getElementById('videoFile').files[0];
    const vttFile = document.getElementById('vttFile').files[0];

    if (!videoFile || !vttFile) {
        alert("Please select both a video file and a subtitle file.");
        return;
    }

    openDB().then((db) => {
        // Read files and save them in IndexedDB
        const readFileAsDataURL = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject('File read error');
                reader.readAsDataURL(file);
            });
        };

        Promise.all([readFileAsDataURL(videoFile), readFileAsDataURL(vttFile)])
            .then(([videoDataURL, vttDataURL]) => {
                // Save both files to IndexedDB
                return Promise.all([
                    saveFileToDB(db, 'video', videoDataURL),
                    saveFileToDB(db, 'vtt', vttDataURL)
                ]);
            })
            .then(() => {
                // Redirect after successful storage
                window.location.href = 'video.html';
            })
            .catch((error) => {
                console.error("Failed to save files:", error);
                alert("Failed to save files. Please try again.");
            });
    }).catch((error) => {
        console.error("Failed to open database:", error);
        alert("Database error. Please try again.");
    });
});
