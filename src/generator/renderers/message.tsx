import {
  DiscordAttachments,
  DiscordCommand,
  DiscordMessage as DiscordMessageComponent,
  DiscordReaction,
  DiscordReactions,
  DiscordThread,
  DiscordThreadMessage,
} from '@derockdev/discord-components-react';
import type { Message as MessageType } from 'discord.js';
import React from 'react';
import type { RenderMessageContext } from '..';
import { parseDiscordEmoji } from '../../utils/utils';
import { isComponentsV2Message, ComponentV2 } from '../../types';
import { Attachments } from './attachment';
import ComponentRow from './components';
import { ComponentsV2Wrapper } from './componentsV2';
import { parseV2Components, hasV2Components } from './componentsV2Parser';
import MessageContent, { RenderType } from './content';
import { DiscordEmbed } from './embed';
import MessageReply from './reply';
import DiscordSystemMessage from './systemMessage';

export default function DiscordMessage({
  message,
  context,
}: {
  message: MessageType;
  context: RenderMessageContext;
}) {
  if (message.system) return <DiscordSystemMessage message={message} />;

  const isCrosspost = message.reference && message.reference.guildId !== message.guild?.id;
  const isV2Message = isComponentsV2Message(message); // Demo: treat bot messages as V2

  return (
    <DiscordMessageComponent
      id={`m-${message.id}`}
      timestamp={message.createdAt.toISOString()}
      key={message.id}
      edited={message.editedAt !== null}
      server={isCrosspost ?? undefined}
      highlight={message.mentions.everyone}
      profile={message.author.id}
    >
      {/* reply */}
      <MessageReply message={message} context={context} />

      {/* slash command */}
      {message.interaction && (
        <DiscordCommand
          slot="reply"
          profile={message.interaction.user.id}
          command={'/' + message.interaction.commandName}
        />
      )}

      {/* Components V2 rendering */}
      {isV2Message ? (
        <ComponentsV2Message message={message} context={context} />
      ) : (
        <ComponentsV1Message message={message} context={context} />
      )}

      {/* reactions */}
      {message.reactions.cache.size > 0 && (
        <DiscordReactions slot="reactions">
          {message.reactions.cache.map((reaction, id) => (
            <DiscordReaction
              key={`${message.id}r${id}`}
              name={reaction.emoji.name!}
              emoji={parseDiscordEmoji(reaction.emoji)}
              count={reaction.count}
            />
          ))}
        </DiscordReactions>
      )}

      {/* threads */}
      {message.hasThread && message.thread && (
        <DiscordThread
          slot="thread"
          name={message.thread.name}
          cta={
            message.thread.messageCount
              ? `${message.thread.messageCount} Message${message.thread.messageCount > 1 ? 's' : ''}`
              : 'View Thread'
          }
        >
          {message.thread.lastMessage ? (
            <DiscordThreadMessage profile={message.thread.lastMessage.author.id}>
              <MessageContent
                content={
                  message.thread.lastMessage.content.length > 128
                    ? message.thread.lastMessage.content.substring(0, 125) + '...'
                    : message.thread.lastMessage.content
                }
                context={{ ...context, type: RenderType.REPLY }}
              />
            </DiscordThreadMessage>
          ) : (
            `Thread messages not saved.`
          )}
        </DiscordThread>
      )}
    </DiscordMessageComponent>
  );
}

// Components V1 (traditional) message rendering
function ComponentsV1Message({ message, context }: { message: MessageType; context: RenderMessageContext }) {
  return (
    <>
      {/* message content */}
      {message.content && (
        <MessageContent
          content={message.content}
          context={{ ...context, type: message.webhookId ? RenderType.WEBHOOK : RenderType.NORMAL }}
        />
      )}

      {/* attachments */}
      <Attachments message={message} context={context} />

      {/* message embeds */}
      {message.embeds.map((embed, id) => (
        <DiscordEmbed embed={embed} context={{ ...context, index: id, message }} key={id} />
      ))}

      {/* components */}
      {message.components.length > 0 && (
        <DiscordAttachments slot="components">
          {message.components.map((component, id) => (
            <ComponentRow key={id} id={id} row={component as any} />
          ))}
        </DiscordAttachments>
      )}
    </>
  );
}

// Components V2 message rendering
function ComponentsV2Message({ message, context }: { message: MessageType; context: RenderMessageContext }) {
  // In Components V2, the message content and embeds are replaced by components
  // Parse the actual V2 components from the message data
  
  try {
    // Check if the message has V2 components using our parser
    if (hasV2Components(message)) {
      // Parse the V2 components from the message
      const v2Components = parseV2Components(message.components as any[]);
      
      if (v2Components.length > 0) {
        return (
          <div className="discord-v2-message-content">
            {/* Render V2 components */}
            <ComponentsV2Wrapper components={v2Components} context={context} />
          </div>
        );
      }
    }
    
    // For testing - create a demo V2 component for bot messages
    if (message.author.bot) {
      const testV2Components = createTestV2Components(message);
      return (
        <div className="discord-v2-message-content">
          <ComponentsV2Wrapper components={testV2Components} context={context} />
        </div>
      );
    }
  } catch (error) {
    console.warn('Failed to parse V2 components:', error);
  }

  // If no V2 components found or parsing failed, fallback to V1 rendering
  return <ComponentsV1Message message={message} context={context} />;
}

// Create test V2 components for demonstration
function createTestV2Components(message: MessageType): ComponentV2[] {
  const components: ComponentV2[] = [];
  
  // Create a container with the message content
  if (message.content) {
    components.push({
      type: 12, // Container
      children: [
        {
          type: 14, // TextDisplay
          content: message.content,
          style: 'paragraph'
        }
      ],
      accent_color: '#5865f2'
    });
  } else {
    // Create a default V2 component for bot messages without content
    components.push({
      type: 12, // Container
      children: [
        {
          type: 14, // TextDisplay
          content: '🤖 This bot message is now rendered using Discord Components V2!',
          style: 'paragraph'
        }
      ],
      accent_color: '#5865f2'
    });
  }
  
  // Add embeds as V2 components
  if (message.embeds.length > 0) {
    for (const embed of message.embeds) {
      const embedChildren: ComponentV2[] = [];
      
      if (embed.title) {
        embedChildren.push({
          type: 14, // TextDisplay
          content: embed.title,
          style: 'heading2'
        });
      }
      
      if (embed.description) {
        embedChildren.push({
          type: 14, // TextDisplay
          content: embed.description,
          style: 'paragraph'
        });
      }
      
      if (embed.thumbnail?.url) {
        embedChildren.push({
          type: 15, // Thumbnail
          url: embed.thumbnail.url,
          alt_text: 'Embed thumbnail'
        });
      }
      
      if (embedChildren.length > 0) {
        components.push({
          type: 12, // Container
          children: embedChildren,
          accent_color: embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : undefined
        });
      }
    }
  }
  
  // Add attachments as media gallery
  if (message.attachments.size > 0) {
    const mediaItems = Array.from(message.attachments.values())
      .filter(att => att.contentType?.startsWith('image/'))
      .map(att => ({
        url: att.url,
        altText: att.name || 'Attachment',
        type: 'image' as const
      }));
      
    if (mediaItems.length > 0) {
      components.push({
        type: 16, // MediaGallery
        items: mediaItems
      });
    }
  }
  
  return components;
}
