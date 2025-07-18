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
  const roles: Record<string, any> = {};
  const channels: Record<string, any> = {};

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
    await extractMentionedEntities(message, profiles, roles, channels);
  }

  // return as a JSON with all entity types
  return {
    ...profiles,
    _roles: roles,
    _channels: channels,
  };
}

async function extractMentionedEntities(
  message: Message, 
  profiles: Record<string, Profile>, 
  roles: Record<string, any>, 
  channels: Record<string, any>
) {
  const userMentions = new Set<string>();
  const roleMentions = new Set<string>();
  const channelMentions = new Set<string>();

  // Extract from regular message content
  if (message.content) {
    extractMentionsFromText(message.content, userMentions, roleMentions, channelMentions);
  }

  // Extract from V2 components
  if (message.components) {
    extractMentionsFromComponents(message.components, userMentions, roleMentions, channelMentions);
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

  // Resolve mentioned roles
  for (const roleId of roleMentions) {
    if (!roles[roleId] && message.guild) {
      try {
        const role = await message.guild.roles.fetch(roleId);
        roles[roleId] = {
          name: role?.name || `Role ${roleId}`,
          color: role?.hexColor || '#99aab5',
        };
      } catch (error) {
        roles[roleId] = {
          name: `Role ${roleId}`,
          color: '#99aab5',
        };
      }
    }
  }

  // Resolve mentioned channels
  for (const channelId of channelMentions) {
    if (!channels[channelId]) {
      try {
        const channel = await message.client.channels.fetch(channelId);
        channels[channelId] = {
          name: (channel as any)?.name || `Channel ${channelId}`,
          type: channel?.type || 'text',
        };
      } catch (error) {
        channels[channelId] = {
          name: `Channel ${channelId}`,
          type: 'text',
        };
      }
    }
  }
}

function extractMentionsFromText(
  text: string, 
  userMentions: Set<string>, 
  roleMentions: Set<string>, 
  channelMentions: Set<string>
) {
  // User mentions: <@123> or <@!123>
  const userRegex = /<@!?(\d+)>/g;
  let match;
  while ((match = userRegex.exec(text)) !== null) {
    userMentions.add(match[1]);
  }

  // Role mentions: <@&123>
  const roleRegex = /<@&(\d+)>/g;
  while ((match = roleRegex.exec(text)) !== null) {
    roleMentions.add(match[1]);
  }

  // Channel mentions: <#123>
  const channelRegex = /<#(\d+)>/g;
  while ((match = channelRegex.exec(text)) !== null) {
    channelMentions.add(match[1]);
  }
}

function extractMentionsFromComponents(
  components: any[], 
  userMentions: Set<string>, 
  roleMentions: Set<string>, 
  channelMentions: Set<string>
) {
  for (const component of components) {
    if (component.data?.content) {
      extractMentionsFromText(component.data.content, userMentions, roleMentions, channelMentions);
    }
    
    // Recursively check nested components
    if (component.components) {
      extractMentionsFromComponents(component.components, userMentions, roleMentions, channelMentions);
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
