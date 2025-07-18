import { type GuildMember, type Message, type User, UserFlags } from 'discord.js';

export type Profile = {
  author: string; // author of the message
  avatar?: string; // avatar of the author
  roleColor?: string; // role color of the author
  roleIcon?: string; // role color of the author
  roleName?: string; // role name of the author

  bot?: boolean; // is the author a bot
  verified?: boolean; // is the author verified
};

export async function buildProfiles(messages: Message[]) {
  const profiles: Record<string, Profile> = {};

  // loop through messages
  for (const message of messages) {
    // add all users
    const author = message.author;
    if (!profiles[author.id]) {
      // add profile
      profiles[author.id] = buildProfile(message.member, author);
    }

    // add interaction users
    if (message.interaction) {
      const user = message.interaction.user;
      if (!profiles[user.id]) {
        profiles[user.id] = buildProfile(null, user);
      }
    }

    // threads
    if (message.thread && message.thread.lastMessage) {
      profiles[message.thread.lastMessage.author.id] = buildProfile(
        message.thread.lastMessage.member,
        message.thread.lastMessage.author
      );
    }

    // extract user mentions from message content and V2 components
    await extractMentionedUsers(message, profiles);
  }

  // return as a JSON
  return profiles;
}

async function extractMentionedUsers(message: Message, profiles: Record<string, Profile>) {
  const userMentions = new Set<string>();

  // Extract from regular message content
  if (message.content) {
    const mentionRegex = /<@!?(\d+)>/g;
    let match;
    while ((match = mentionRegex.exec(message.content)) !== null) {
      userMentions.add(match[1]);
    }
  }

  // Extract from V2 components
  if (message.components) {
    extractMentionsFromComponents(message.components, userMentions);
  }

  // Resolve mentioned users
  for (const userId of userMentions) {
    if (!profiles[userId]) {
      try {
        const user = await message.client.users.fetch(userId);
        const member = message.guild?.members.cache.get(userId) || 
                     (message.guild ? await message.guild.members.fetch(userId).catch(() => null) : null);
        profiles[userId] = buildProfile(member, user);
      } catch (error) {
        // If user can't be fetched, create a minimal profile
        profiles[userId] = {
          author: `User ${userId}`,
          bot: false,
          verified: false,
        };
      }
    }
  }
}

function extractMentionsFromComponents(components: any[], userMentions: Set<string>) {
  for (const component of components) {
    if (component.data?.content) {
      const mentionRegex = /<@!?(\d+)>/g;
      let match;
      while ((match = mentionRegex.exec(component.data.content)) !== null) {
        userMentions.add(match[1]);
      }
    }
    
    // Recursively check nested components
    if (component.components) {
      extractMentionsFromComponents(component.components, userMentions);
    }
  }
}

function buildProfile(member: GuildMember | null, author: User) {
  return {
    author: member?.nickname ?? author.displayName ?? author.username,
    avatar: member?.displayAvatarURL({ size: 64 }) ?? author.displayAvatarURL({ size: 64 }),
    roleColor: member?.displayHexColor,
    roleIcon: member?.roles.icon?.iconURL() ?? undefined,
    roleName: member?.roles.hoist?.name ?? undefined,
    bot: author.bot,
    verified: author.flags?.has(UserFlags.VerifiedBot),
  };
}
