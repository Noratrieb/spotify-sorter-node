import Spotify from "spotify-web-api-js";
import fs from "fs/promises";
import * as http from "http";
import open from "open";
import {startSort} from "./Sort";

export const api = new Spotify();

// @ts-ignore this is fine
global.XMLHttpRequest = require('xhr2');
// @ts-ignore this is fine
global.window = {Promise: Promise};

let indexHtml: Buffer;

fs.readFile("index.html").then(file => {
    indexHtml = file;
}).catch(() => {
    console.error("index.html not found")
    process.exit(1);
});

const webServer = http.createServer((req, res) => {
    if (req.method === "GET") {
        res.writeHead(200, {"content-type": "text/html"});
        res.write(indexHtml);
        res.end();
    } else if (req.method === "POST") {
        let body = "";

        req.on("readable", () => {
            body += req.read();
        })

        req.on("end", () => {
            api.setAccessToken(body.trim());
            console.log(`"${body.trim()}"`)
            res.end();

            webServer.close();

            console.log("Token found!");

            api.getUserPlaylists().then(lists => console.log(lists.items.map(list => list.name))).catch(err => console.error(err.response))

            //api.getMyCurrentPlayingTrack().then(track => {
            //    if (track.item) {
            //        console.log(`Currently listening ${track.item.name} on ${track.item.album.name} ${track.progress_ms! / 1000}s`);
            //    } else {
            //        console.log("Not listening anything at the moment");
            //    }
            //}).catch(console.error)

            startSort();
        })
    }
});
webServer.listen(8080);

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const CLIENT_ID = "33a3b4c341734c20b40fe58c72acdc36";
const REDIRECT_URI = "http://localhost:8080";
const SCOPES = [
    "playlist-modify-private",
    "playlist-read-private",
    "playlist-modify-public",
    "streaming",
];

const URL = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES.join("%20")}&response_type=token&show_dialog=true`;
open(URL).then();

console.log("Spotify playlist sorter")
