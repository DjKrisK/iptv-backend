const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// DATABASE
// =====================
let channels = [];
let movies = [];
let series = [];
let users = [
  { username: "admin", password: "1234" }
];

// =====================
// 🧑‍💻 ADMIN PANEL
// =====================
app.get("/", (req, res) => {
  res.send(`
    <h1>IPTV BACKEND PANEL</h1>

    <h2>Add Channel</h2>
    <form method="POST" action="/add-channel">
      <input name="name" placeholder="Channel Name" required/><br/>
      <input name="url" placeholder="Stream URL" required/><br/>
      <input name="group" placeholder="Group" required/><br/>
      <button>Add</button>
    </form>

    <h2>Add Movie</h2>
    <form method="POST" action="/add-movie">
      <input name="name" placeholder="Movie Name" required/><br/>
      <input name="url" placeholder="Movie URL" required/><br/>
      <button>Add</button>
    </form>

    <h2>Add Series</h2>
    <form method="POST" action="/add-series">
      <input name="name" placeholder="Series Name" required/><br/>
      <textarea name="data" placeholder='JSON seasons/episodes'></textarea><br/>
      <button>Add Series</button>
    </form>

    <h2>Sync M3U</h2>
    <form method="GET" action="/sync">
      <input name="url" placeholder="M3U Link" style="width:300px"/><br/>
      <button>Sync</button>
    </form>

    <hr/>
    <a href="/live.m3u">Live M3U</a><br/>
    <a href="/vod.m3u">VOD M3U</a><br/>
    <a href="/series.m3u">Series M3U</a>
  `);
});


// =====================
// ➕ CHANNEL
// =====================
app.post("/add-channel", (req, res) => {
  channels.push(req.body);
  res.redirect("/");
});

// =====================
// ➕ MOVIE
// =====================
app.post("/add-movie", (req, res) => {
  movies.push(req.body);
  res.redirect("/");
});

// =====================
// ➕ SERIES
// =====================
app.post("/add-series", (req, res) => {
  try {
    series.push({
      name: req.body.name,
      data: JSON.parse(req.body.data)
    });
    res.redirect("/");
  } catch {
    res.send("Invalid JSON");
  }
});

// =====================
// 🔄 M3U SYNC
// =====================
app.get("/sync", async (req, res) => {
  try {
    const response = await axios.get(req.query.url);
    const lines = response.data.split("\n");

    let name = "";

    lines.forEach(line => {
      if (line.startsWith("#EXTINF")) {
        name = line.split(",")[1];
      }

      if (line.startsWith("http")) {
        channels.push({
          name,
          url: line,
          group: "Imported"
        });
      }
    });

    res.send("Sync complete");
  } catch {
    res.send("Sync failed");
  }
});


// =====================
// 📺 LIVE M3U
// =====================
app.get("/live.m3u", (req, res) => {
  let m3u = "#EXTM3U\n";

  channels.forEach(c => {
    m3u += `#EXTINF:-1 group-title="${c.group}",${c.name}\n`;
    m3u += `${c.url}\n`;
  });

  res.send(m3u);
});


// =====================
// 🎬 MOVIES M3U
// =====================
app.get("/vod.m3u", (req, res) => {
  let m3u = "#EXTM3U\n";

  movies.forEach(m => {
    m3u += `#EXTINF:-1 group-title="Movies",${m.name}\n`;
    m3u += `${m.url}\n`;
  });

  res.send(m3u);
});


// =====================
// 📺 SERIES M3U
// =====================
app.get("/series.m3u", (req, res) => {
  let m3u = "#EXTM3U\n";

  series.forEach(s => {
    s.data.seasons.forEach(season => {
      season.episodes.forEach(ep => {
        m3u += `#EXTINF:-1 group-title="${s.name} S${season.season}",${s.name} - S${season.season}\n`;
        m3u += `${ep.url}\n`;
      });
    });
  });

  res.send(m3u);
});


// =====================
// 🔐 XTREAM LOGIN API
// =====================
app.get("/player_api.php", (req, res) => {
  const { username, password } = req.query;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.json({ user_info: { auth: 0 } });
  }

  res.json({
    user_info: {
      username,
      auth: 1
    },
    server_info: {
      status: "online"
    }
  });
});

app.listen(3000, () => {
  console.log("IPTV backend running");
});