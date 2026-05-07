const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Travian HQ server running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.post("/save", async (req, res) => {

  const { villageId, villageName, content } = req.body;

  const slug = villageName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const channelName = `${villageId}-${slug}`;

  const guild = client.guilds.cache.first();

  const channel = await getOrCreateChannel(guild, channelName);

  const messages = await channel.messages.fetch({ limit: 1 });
  const lastMessage = messages.first();

  if (lastMessage) {
    await lastMessage.edit(content);
  } else {
    await channel.send(content);
  }

  res.json({ ok: true });
});

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.login(process.env.DISCORD_TOKEN);

client.once("ready", () => {
  console.log("Discord bot listo");
});

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
