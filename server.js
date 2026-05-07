require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// MEMORY STORAGE (IMPORTANTE)
// ==========================
const tasks = {};

// ==========================
// HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.send("Travian HQ server running");
});

// ==========================
// GET TASKS (PARA LA EXTENSIÓN)
// ==========================
app.get("/get", (req, res) => {

  const { villageId } = req.query;

  if (!villageId || !tasks[villageId]) {
    return res.json({ content: "" });
  }

  res.json(tasks[villageId]);
});

// ==========================
// SAVE TASKS (EXTENSION → SERVER → DISCORD)
// ==========================
app.post("/save", async (req, res) => {

  const { villageId, villageName, content } = req.body;

  // guardar en memoria (PARA PODER LEER DESPUÉS)
  tasks[villageId] = {
    villageId,
    villageName,
    content
  };

  const slug = villageName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const channelName = `${villageId}-${slug}`;

  const guild = client.guilds.cache.first();
  if (!guild) {
    return res.status(500).json({ error: "No guild found" });
  }

  const channel = await getOrCreateChannel(guild, channelName);

  const messages = await channel.messages.fetch({ limit: 1 });
  const lastMessage = messages.first();

  const text = content || "";

  if (lastMessage) {
    await lastMessage.edit(text);
  } else {
    await channel.send(text);
  }

  res.json({ ok: true });
});

// ==========================
// DISCORD BOT
// ==========================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.login(process.env.DISCORD_TOKEN);

client.once("ready", () => {
  console.log("Discord bot listo");
});

// ==========================
// CREATE / GET CHANNEL
// ==========================
async function getOrCreateChannel(guild, channelName) {

  let channel = guild.channels.cache.find(
    c => c.name === channelName
  );

  if (channel) return channel;

  channel = await guild.channels.create({
    name: channelName,
    type: 0
  });

  return channel;
}

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});