require("dotenv").config();
let discordReady = false;

const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.send("Travian HQ server running");
});

// ==========================
// GET TASKS (PARA LA EXTENSIÓN)
// ==========================
app.get("/get", async (req, res) => {
    if (!discordReady) {
  return res.status(503).json({ error: "Discord not ready yet" });
}
  const { villageId } = req.query;

  if (!villageId) {
    return res.status(400).json({ error: "missing villageId" });
  }

  try {

    const guild = client.guilds.cache.first();

    if (!guild) {
      return res.status(500).json({ error: "No guild found" });
    }

    // buscar canal por villageId
    const channel = guild.channels.cache.find(c =>
      c.name.startsWith(villageId + "-")
    );

    if (!channel) {
      return res.json({ content: "" });
    }

    // leer último mensaje
    const messages = await channel.messages.fetch({ limit: 1 });
    const lastMessage = messages.first();

    if (!lastMessage) {
      return res.json({ content: "" });
    }

    return res.json({
      villageId,
      content: lastMessage.content
    });

  } catch (err) {
    console.log("GET error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

// ==========================
// SAVE TASKS (EXTENSION → SERVER → DISCORD)
// ==========================
app.post("/save", async (req, res) => {

  const { villageId, villageName, content } = req.body;

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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

client.login(process.env.DISCORD_TOKEN);

client.once("ready", () => {
  console.log("Discord bot listo");
  discordReady = true;
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