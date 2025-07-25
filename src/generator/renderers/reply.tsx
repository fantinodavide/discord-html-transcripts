import { DiscordReply } from '@derockdev/discord-components-react';
import { type Message, UserFlags } from 'discord.js';
import type { RenderMessageContext } from '..';
import React from 'react';
import MessageContent, { RenderType } from './content';

export default function MessageReply({ message, context }: { message: Message; context: RenderMessageContext }) {
  if (!message.reference) return null;
  if (message.reference.guildId !== message.guild?.id) return null;

  const referencedMessage = context.messages.find((m) => m.id === message.reference!.messageId);

  if (!referencedMessage) return <DiscordReply slot="reply">Message could not be loaded.</DiscordReply>;

  const isCrosspost = referencedMessage.reference && referencedMessage.reference.guildId !== message.guild?.id;
  const isCommand = referencedMessage.interaction !== null;

  return (
    <DiscordReply
      slot="reply"
      edited={!isCommand && referencedMessage.editedAt !== null}
      attachment={referencedMessage.attachments.size > 0}
      author={
        referencedMessage.member?.nickname ?? referencedMessage.author.displayName ?? referencedMessage.author.username
      }
      avatar={referencedMessage.author.avatarURL({ size: 32 }) ?? undefined}
      roleColor={referencedMessage.member?.displayHexColor ?? undefined}
      bot={!isCrosspost && referencedMessage.author.bot}
      verified={referencedMessage.author.flags?.has(UserFlags.VerifiedBot)}
      op={message?.channel?.isThread?.() && referencedMessage.author.id === message?.channel?.ownerId}
      server={isCrosspost ?? undefined}
      command={isCommand}
    >
      {referencedMessage.content ? (
        <span data-goto={referencedMessage.id}>
          <MessageContent content={referencedMessage.content} context={{ ...context, type: RenderType.REPLY }} />
        </span>
      ) : isCommand ? (
        <em data-goto={referencedMessage.id}>Click to see command.</em>
      ) : (
        <em data-goto={referencedMessage.id}>Click to see attachment.</em>
      )}
    </DiscordReply>
  );
}
