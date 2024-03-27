const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");

/**
 * @param {Blob} blob
 */
const sendAudioDataToBeProcessed = async (blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "audio.pcm");

    fetch("/process-audio", {
        method: "POST",
        body: formData,
    })
        .then((res) => res.text())
        .then(console.log);
};

/**
 * @type {MediaRecorder}
 */
let mediaRecorder = null;

const start = async () => {
    if (mediaRecorder) return;

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
    });

    mediaRecorder = new MediaRecorder(stream);

    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks);

        sendAudioDataToBeProcessed(blob);

        mediaRecorder = null;
    };

    mediaRecorder.start();
};

const stop = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
};

startButton.addEventListener("click", start);
stopButton.addEventListener("click", stop);
