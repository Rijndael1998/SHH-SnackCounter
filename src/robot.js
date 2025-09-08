const { spawn } = require("child_process");
const { hashPBKDF2, UDPEncryptedTransport } = require("./crypto.mjs");
const { setInterval } = require("timers");

// crypto
const salt = Uint8Array.from("salt");
const pw = Uint8Array.from("yippie!");
const key = hashPBKDF2(salt, 32, pw);

// this was the best command
// rpicam-vid -t 0 --hflip 1 --width 1536 --height 864 --framerate 45 --bitrate 5000000 --low-latency --inline -o "udp://192.168.1.239:41234" 
const br = 2000000 / 4;
const fr = 30;
const cameraArgs = [
    "-t", "0",
    // "--hflip", "1",
    "--width", "1536",
    "--height", "864",
    "--framerate", fr,
    "--bitrate", br,
    "--low-latency",
    "--inline",
    "-o", "-",
];

const domain = "192.168.1.239";
const cameraOutput = /#(\d+) \((\d+\.\d*) fps+\) exp (\d+\.\d*) ag (\d+\.\d*) dg (\d+\.\d*)/;
const camera = spawn("rpicam-vid", cameraArgs);
const controls = spawn("python3", ["./rover/controls.py"]);


let outputBuffer = Buffer.alloc(0);

const videoTransport = new UDPEncryptedTransport(domain, 41234, key, false);
const telemTransport = new UDPEncryptedTransport(domain, 51234, key, true);
telemTransport.prefilter = telemTransport.decryptSendJSONData;

camera.stdout.on("data", (data) => {
    // H.264 comes as a stream of NAL units, each starts with start code 00 00 00 01
    // In practice, just forward the raw bytes as soon as you get them, or
    // Buffer and frame as needed per NAL
    outputBuffer = Buffer.concat([outputBuffer, data]);

    // Example simple frame extraction (looks for NAL start codes, and packages NAL units)
    let nalStart;
    while ((nalStart = outputBuffer.indexOf(Buffer.from([0, 0, 0, 1]), 1)) !== -1) {
        // Split at next NAL unit
        let nalUnit = outputBuffer.slice(0, nalStart);
        outputBuffer = outputBuffer.slice(nalStart);

        videoTransport.send(Buffer.from(nalUnit)); // CHANGE ME
    }
});

camera.stderr.on("data", (data) => {
    const st = Buffer.from(data).toString().match(cameraOutput);

    if (st === null)
        return;

    const content = JSON.stringify({
        k: "camera_rapid",
        v: {
            frame: st[1],
            fps: st[2],
            ex: st[3],
            ag: st[4],
            dg: st[5],
        },
    });

    telemTransport.sendAsJson(content);
});

// rover control
telemTransport.dataListener = (d, _) => {
    const command = Buffer.from(d).toString();
    console.log("got command:", command);
    controls.stdin.write(Buffer.from(d).toString() + "\n");
}

controls.stdout.on("data", (d) => {
    telemTransport.sendAsJson(Buffer.from(d).toString());
});

controls.stderr.on("data", (d) => {
    console.log("got data from stderr", Buffer.from(d).toString());
});

controls.stderr.on("error", (d) => {
    console.log("got error from stderr", Buffer.from(d).toString());
});

// more telemetry
setInterval(() => {
    controls.stdin.write(JSON.stringify({
        command: "distance",
        payload: {}
    }) + "\n");
}, 100);