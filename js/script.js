console.log('Let’s write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    const response = await fetch(`/${folder}/`);
    const text = await response.text();

    const parser = document.createElement("div");
    parser.innerHTML = text;

    const anchors = parser.getElementsByTagName("a");
    songs = [];

    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "<li>Loading songs...</li>";
    play.disabled = true;

    for (const anchor of anchors) {
        if (anchor.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(anchor.href.split(`/${folder}/`)[1]));
        }
    }

    songUL.innerHTML = "";

    if (songs.length === 0) {
        songUL.innerHTML = "<li>No songs available in this folder.</li>";
        return [];
    }

    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="img/music.svg" alt="Song icon">
                <div class="info">
                    <div>${song}</div>
                    <div>Harry</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="Play icon">
                </div>
            </li>`;
    }

    Array.from(songUL.getElementsByTagName("li")).forEach((li) => {
        li.addEventListener("click", () => {
            playMusic(li.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });

    play.disabled = false;
    return songs;
}

function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    document.querySelectorAll(".songList li").forEach(li => li.classList.remove("active-song"));
    document.querySelectorAll(".songList li").forEach(li => {
        if (li.querySelector(".info").firstElementChild.innerText.trim() === decodeURI(track)) {
            li.classList.add("active-song");
        }
    });
}

async function displayAlbums() {
    const response = await fetch(`/songs/`);
    const text = await response.text();

    const parser = document.createElement("div");
    parser.innerHTML = text;

    const anchors = parser.getElementsByTagName("a");
    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (const anchor of anchors) {
        if (anchor.href.includes("/songs") && !anchor.href.includes(".htaccess")) {
            const folder = anchor.href.split("/").slice(-2)[0];

            let albumData = { title: folder, description: "No info.json found" };
            try {
                const albumResponse = await fetch(`/songs/${folder}/info.json`);
                albumData = await albumResponse.json();
            } catch (err) {
                console.warn(`Could not load info.json for ${folder}`);
            }

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" onerror="this.src='img/default.jpg'" alt="${albumData.title}">
                    <h2>${albumData.title}</h2>
                    <p>${albumData.description}</p>
                </div>`;
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async (event) => {
            card.classList.add("loading");
            songs = await getSongs(`songs/${event.currentTarget.dataset.folder}`);
            if (songs.length > 0) playMusic(songs[0]);
            card.classList.remove("loading");
        });
    });
}

async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        if (currentSong.duration) {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });
localStorage.setItem("lastTrack", track);

const lastTrack = localStorage.getItem("lastTrack");
if (lastTrack && songs.includes(lastTrack)) {
    playMusic(lastTrack, true);
} else {
    playMusic(songs[0], true);
}


    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const rect = e.target.getBoundingClientRect();
        if (!currentSong.duration) return;
        const percent = (e.clientX - rect.left) / rect.width;
        currentSong.currentTime = percent * currentSong.duration;
        document.querySelector(".circle").style.left = percent * 100 + "%";
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
        document.querySelector(".volume>img").src = currentSong.volume > 0 ? "img/volume.svg" : "img/mute.svg";
    });

    document.querySelector(".volume>img").addEventListener("click", (e) => {
        const volumeIcon = e.target;
        if (volumeIcon.src.includes("volume.svg")) {
            volumeIcon.src = "img/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            volumeIcon.src = "img/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
