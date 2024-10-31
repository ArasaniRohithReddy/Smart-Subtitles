const video = document.getElementById('myVideo');
const subtitleDisplay = document.getElementById('subtitleDisplay');
const subtitleTrack = video.textTracks[0]; // Access the first subtitle track

subtitleTrack.mode = "hidden"; // Hide default subtitles rendering

// Fetch the meaning of the word using a dictionary API
const fetchWordMeaning = async (word) => {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (response.ok) {
            const data = await response.json();
            // Extract the first definition (you can refine this as needed)
            return data[0]?.meanings[0]?.definitions[0]?.definition || "No meaning found.";
        }
        return "No meaning found.";
    } catch (error) {
        console.error("Error fetching meaning:", error);
        return "Error fetching meaning.";
    }
};
video.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
        subtitleDisplay.style.fontSize = "2em"; // Increase size in fullscreen
    } else {
        subtitleDisplay.style.fontSize = "1.5em"; // Reset size
    }
});
// Add tooltips to each word with meanings fetched from the API
const addTooltipToWords = async (text) => {
    const words = text.split(' ');
    const wordSpans = await Promise.all(words.map(async (word) => {
        const meaning = await fetchWordMeaning(word);
        console.log(`Word: ${word}, Meaning: ${meaning}`); // Debugging log
        return `<span class="tooltip" data-tooltip="${meaning}">${word}</span>`;
    }));
    console.log("Generated HTML:", wordSpans.join(' '));
    subtitleDisplay.innerHTML = wordSpans.join(' ');
};


// Handle subtitle track cue change event
subtitleTrack.addEventListener('cuechange', () => {
    const activeCue = subtitleTrack.activeCues[0]; // Get the currently active cue
    if (activeCue) {
        console.log(`Active Cue Text: ${activeCue.text}`); // Debugging log
        addTooltipToWords(activeCue.text); // Add tooltips to each word
    } else {
        subtitleDisplay.innerHTML = ''; // Clear the subtitle when no cue is active
    }
});
// IndexedDB database setup
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SmartSubtitlesDB', 1);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Database error:', event.target.error);
        };
    });
};

const getFileFromDB = (db, type) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(type);

        request.onsuccess = (event) => {
            resolve(event.target.result?.fileData);
        };

        request.onerror = (event) => {
            reject('Get file error:', event.target.error);
        };
    });
};

openDB().then((db) => {
    Promise.all([getFileFromDB(db, 'video'), getFileFromDB(db, 'vtt')])
        .then(([videoDataURL, vttDataURL]) => {
            if (!videoDataURL || !vttDataURL) {
                alert("Video or subtitle not found. Please upload files again.");
                return;
            }

            // Set video and subtitles
            document.getElementById('myVideo').src = videoDataURL;
            document.getElementById('subtitleTrack').src = vttDataURL;
        })
        .catch((error) => {
            console.error("Error retrieving files:", error);
            alert("Error retrieving files.");
        });
});


