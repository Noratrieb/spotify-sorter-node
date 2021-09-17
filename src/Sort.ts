import {api} from "./index";

import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const stdinIter = rl[Symbol.asyncIterator]();

export function initialize() {
    try {
        start().then();
    } catch (e) {
        console.error("An error occurred", e);
    }
}

async function start() {
    const playlists = await api.getUserPlaylists();
    const playlist = await selectPlaylist(playlists.items);
    const tracks = await sortPlaylist(playlist);

}


async function selectPlaylist(playlists: SpotifyApi.PlaylistObjectSimplified[]): Promise<SpotifyApi.PlaylistObjectFull> {
    let i = 0;
    for (const list of playlists) {
        console.log(`${i} - ${list.name}`)
        i++;
    }

    const index = await readNumber(playlists.length);
    return await api.getPlaylist(playlists[index].id);
}

async function sortPlaylist(playlist: SpotifyApi.PlaylistObjectFull): Promise<SpotifyApi.PlaylistTrackObject[]> {
    console.log(`Playlist to sort: ${playlist.name}`);

    let tracks = playlist.tracks.items;
    let pagingTracks = playlist.tracks;
    while (pagingTracks.next) {
        pagingTracks = await api.getPlaylistTracks(playlist.id, {
            offset: pagingTracks.offset + pagingTracks.limit,
        });
        tracks = [...tracks, ...pagingTracks.items];
    }

    const tracksSorted = await asyncQuickSort(tracks, compare);

    for (const track of tracksSorted) {
        console.log(`${track.track.name}  ---  ${track.track.href}`)
    }
    return tracksSorted;
}


async function compare({track: track1}: SpotifyApi.PlaylistTrackObject, {track: track2}: SpotifyApi.PlaylistTrackObject): Promise<number> {
    console.log("-".repeat(20))
    console.log(`0: ${track1.name}  --  ${track1.href}`);
    console.log(`1: ${track2.name}  --  ${track2.href}`);
    const input = await readNumber(2);
    return input === 0 ? -1 : 1;
}

async function readNumber(max?: number): Promise<number> {
    let number;

    const input = await stdinIter.next();
    number = Number(input.value);
    while (isNaN(number) || (max && number >= max)) {
        console.error("error: Invalid number.");
        const input = await stdinIter.next();
        number = Number(input.value);
    }
    return number;
}

type AsyncCompareFn<T> = (a: T, b: T) => Promise<number>;

async function asyncQuickSort<T>(array: T[], compareFn: AsyncCompareFn<T>): Promise<T[]> {
    if (array.length <= 1) {
        return array;
    }
    const pivot = array[0];

    const left = [];
    const right = [];

    for (let i = 1; i < array.length; i++) {
        if (await compareFn(array[i], pivot) < 0) {
            left.push(array[i])
        } else {
            right.push(array[i]);
        }
    }

    return (await asyncQuickSort(left, compareFn)).concat(pivot, await asyncQuickSort(right, compareFn));
}
