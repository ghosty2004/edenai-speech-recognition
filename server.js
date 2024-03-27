import express from "express";
import multer from "multer";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { Readable, Writable } from "node:stream";
import { configDotenv } from "dotenv";

// Express app
const app = express();

// Middlewares
app.use(express.static("public"));

// Config dotenv
configDotenv();

const fields = multer();

const pcmBufferToMp3Buffer = (pcmBuffer) =>
    new Promise((resolve) => {
        const inputStream = new Readable();
        inputStream.push(pcmBuffer);
        inputStream.push(null);

        const outputStream = new Writable();
        const outputChunks = [];
        outputStream._write = (chunk, _encoding, callback) => {
            outputChunks.push(chunk);
            callback();
        };

        ffmpeg()
            .input(inputStream)
            .output(outputStream)
            .format("mp3")
            .audioCodec("libmp3lame")
            .audioBitrate("192k")
            .audioFrequency(44100)

            .on("end", () => {
                resolve(Buffer.concat(outputChunks));
            })

            .run();
    });

app.post("/process-audio", fields.single("audio"), async (req, res) => {
    if (typeof req.file === "undefined") return;

    const { buffer: pcmBuffer } = req.file;

    const buffer = await pcmBufferToMp3Buffer(pcmBuffer);

    const form = new FormData();
    form.append("providers", "openai");
    form.append("language", "ro");
    form.append(
        "file",
        new Blob([buffer], {
            type: "audio/mpeg",
        }),
        "audio.mp3"
    );

    axios
        .post("https://api.edenai.run/v2/audio/speech_to_text_async", form, {
            headers: {
                Authorization: `Bearer ${process.env.EDENAI_API_KEY}`,
                "Content-Type": "multipart/form-data",
            },
        })
        .then(({ data }) => {
            console.log(data);
        });

    res.send("Audio data received !");
});

app.listen(3000, () => {
    console.log("Server listening on port 3000 !");
});
