import * as discord from 'discord.js';
import { createTranscript, ExportReturnType } from '../src';

import { config } from 'dotenv';
import { writeFileSync } from 'fs';
config();

const { GuildMessages, Guilds, MessageContent } = discord.GatewayIntentBits;

const client = new discord.Client({
  intents: [GuildMessages, Guilds, MessageContent],
});

client.on('ready', async () => {
  console.log('Fetching channel: ', process.env.CHANNEL!);
  const channel = await client.channels.fetch(process.env.CHANNEL!);

  if (!channel || !channel.isTextBased()) {
    console.error('Invalid channel provided.');
    process.exit(1);
  }

  console.time('transcript');

  const attachment = await createTranscript(channel, {
    // options go here
    returnType: ExportReturnType.String
  });

  // console.log(attachment)
  
  writeFileSync('transcript.html', attachment)

  console.timeEnd('transcript');

  // await (channel as discord.TextChannel).send({
  //   content: 'Here is the transcript',
  //   files: [attachment],
  // });

  client.destroy();
  process.exit(0);
});

client.login(process.env.TOKEN!);
