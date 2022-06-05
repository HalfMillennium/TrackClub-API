const express = require('express');
const app = express();
const routeNum = '8888'
const session = require('express-session');
const cors = require('cors');
var uuid = require('uuid');
app.use(cors());
app.use(session({secret: uuid.v4()}));
app.use(express.json());

// in microseconds
const CHUNK_SIZE = 120000;
// secondary chunk size (secondary table) in microseconds
const FRAME_SIZE = 8000;
// variable will likely be unused, as the requester should always send a list of songs roughly this length
const DAY_LENGTH = 86400000;
init_time = 0;
// example tracks
track_info = [
    {
        song_name: "Apocalypse Dreams",
        track_id: "f8jf9839f83j9",
        duration: 400
    },
    {
        song_name: "Friday Morning",
        track_id: "f8jf9839f83j9",
        duration: 300
    },
    {
        song_name: "Keep on Lying",
        track_id: "f8jf9839f83j9",
        duration: 200
    },
    {
        song_name: "Sleep Apnea",
        track_id: "f8jf9839f83j9",
        duration: 455
    },
    {
        song_name: "On the Level",
        track_id: "f8jf9839f83j9",
        duration: 301
    }
]

_track_master = []
//-------------------------------------------------------------//

// Fetches "currently" playing track from radio
app.get("/fetch", function(request, response) {
    console.log("Fetching current song...");
    now = Date.now()
    prm_index = Math.floor((now - init_time) / CHUNK_SIZE) - 1;
    snd_index = Math.floor(((now - init_time) % CHUNK_SIZE) / FRAME_SIZE);
    current_segment = track_master[prm_index]
    current_track_info = current_segment.frames[snd_index]
    // access index and create fraction to find approximate timestamp in song ([1] => track_duration, [2] => segment index)
    time_estimate = Math.floor((current_track_info[2] / (CHUNK_SIZE / FRAME_SIZE)) * current_track_info[1])
    
    console.log(`Current track has ID ${current_track_info[0]} at ~${time_estimate}ms`)

    response.sendStatus(202);
});

// Queue
app.post("/load", function (request, response) {
    //track_info = request.body.track_info;
    console.log(`Request to load (${track_info.length}) songs...`);

    // track_master contains 24 hour day of songs, divided into 2 minute (120000ms) chunks
    let track_master = []
    init_time = Date.now()

    // playlist length, in microseconds
    maximum_radio_length = 3600000;  // test value => microseconds in an hour

    curr_sum = 0
    j = 0 // for track_info (received)
    i = 0  // for track_master (generated)

    // make sure j is not out of bounds on track_info!
    while(j < track_info.length && (curr_dur > 0 || i == 0)) {
        _min = Math.min(curr_dur, CHUNK_SIZE)
        curr_sum = curr_sum + _min
        track_frames = Array(Math.ceil((_min / CHUNK_SIZE) * (CHUNK_SIZE / FRAME_SIZE))).fill([track_info.track_id,track_info.duration])
        // add index awareness to each item, so keep track of section of song
        track_frames.map(function(e, i, arr) {
            return e.concat([i+1])
        });
        // clean chunk (most common at beginning of list)
        if(curr_sum % i == 0) {
            curr_sum += curr_dur
            track_master.push({
                song_names: [track_info[i].song_name],
                durations: [_min],
                // frames: [] -> array containing entries corresponding to track_ids, thus I am removing "uris" field
                // # of frames is CHUNK_SIZE / FRAME_SIZE, this times fraction of primary chunk equals number secondary chunks occupied by segment
                frames: track_frames,
                curr_sum: curr_sum + _min
            })
            // decrement current duration by chunk size
            curr_dur = curr_dur - CHUNK_SIZE
        // if there is room left in the chunk for a new song segment (calculate based on segment already present in last chunk)
        } else if(track_master[track_master.length].curr_sum % CHUNK_SIZE + curr_dur <= CHUNK_SIZE){
            last = track_master[track_master.length]
            last.song_names = last.song_names.concat(track_info[i].song_name)
            last.durations = last.durations.concat(track_info[i].duration)
            last.frames = last.frames.concat(track_frames)
            // curr_sum value in last object + sum(last.durations)
            curr_dur = curr_dur - Math.min(curr_dur, track_info[i].duration,(CHUNK_SIZE - (last.curr_sum + last.duration.reduce((a, b) => a + b, 0))))
        }
        i = i + 1
        // if last (or only) chunk of a song has been added to track_master, progress track_info to next song
        if(_min < CHUNK_SIZE || curr_dur == 0) {
            j = j + 1
        }
    }
    _track_master = track_master;
    response.sendStatus(200);
});

//-------------------------------------------------------------//

app.listen(process.env.PORT || '8888', function () {
  console.log(`TC-API is listening on port ${routeNum}.`);
});