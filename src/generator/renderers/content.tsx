import {
  DiscordBold,
  DiscordCodeBlock,
  DiscordCustomEmoji,
  DiscordInlineCode,
  DiscordItalic,
  DiscordMention,
  DiscordQuote,
  DiscordSpoiler,
  DiscordTime,
  DiscordUnderlined,
} from '@derockdev/discord-components-react';
import { type RuleTypesExtended } from 'discord-markdown-parser';
import { ChannelType, type APIMessageComponentEmoji } from 'discord.js';
import React from 'react';
import type { ASTNode } from 'simple-markdown';
import { ASTNode as MessageASTNodes } from 'simple-markdown';
import type { SingleASTNode } from 'simple-markdown';
import type { RenderMessageContext } from '../';
import { parseDiscordEmoji } from '../../utils/utils';
import MarkdownIt from 'markdown-it';
import parseHTML from 'html-react-parser';
// @ts-ignore
import { discordInlinePlugin } from './markdown-it-discord-inline';
import type { Element } from 'domhandler'; // html-react-parser re-exports these
import { isTag, isText } from 'domhandler';

export enum RenderType {
  EMBED,
  REPLY,
  NORMAL,
  WEBHOOK,
}

type RenderContentContext = RenderMessageContext & {
  type: RenderType;

  _internal?: {
    largeEmojis?: boolean;
  };
};

// @ts-ignore
function htmlToReact(html: string): React.ReactNode {
  return parseHTML(html, {
    replace(dom) {
      // 1. Ignore non-elements (text nodes, comments, etc.)
      if (!isTag(dom)) return undefined;

      // 2. Now `dom` is guaranteed to be an Element
      const el = dom as Element;

      switch (el.name) {
        case 'discord-bold':
          return <DiscordBold>{el.children.map(c => (isText(c) ? c.data : '')).join('')}</DiscordBold>;
        case 'discord-italic':
          return <DiscordItalic>{el.children.map(c => (isText(c) ? c.data : '')).join('')}</DiscordItalic>;
        case 'discord-underline':
          return <DiscordUnderlined>{el.children.map(c => (isText(c) ? c.data : '')).join('')}</DiscordUnderlined>;
        case 'discord-strikethrough':
          return <s>{el.children.map(c => (isText(c) ? c.data : '')).join('')}</s>;
        case 'discord-inline-code':
          return <DiscordInlineCode>{el.children.map(c => (isText(c) ? c.data : '')).join('')}</DiscordInlineCode>;
        case 'discord-code-block':
          return (
            <DiscordCodeBlock
              language={el.attribs.language || ''}
              code={el.children.map(c => (isText(c) ? c.data : '')).join('')}
            />
          );
        case 'discord-mention':
          return (
            <DiscordMention type={el.attribs.type as any} id={el.attribs.id} color={el.attribs.color}>
              {el.attribs.id}
            </DiscordMention >
          );
        default:
          return undefined;
      }
    },
  });
}

/**
 * Renders discord markdown content
 * @param content - The content to render
 * @param context - The context to render the content in
 * @returns
 */
export default function MessageContent({ content, context }: { content: string; context: RenderContentContext }) {
  if (context.type === RenderType.REPLY && content.length > 180) content = content.slice(0, 180) + '...';

  // parse the markdown
  const parsed = [ { content, type: 'text' } ];

  // check if the parsed content is only emojis
  const isOnlyEmojis = parsed.every(
    (node) => [ 'emoji', 'twemoji' ].includes(node.type) || (node.type === 'text' && node.content.trim().length === 0)
  );
  if (isOnlyEmojis) {
    // now check if there are less than or equal to 25 emojis
    const emojis = parsed.filter((node) => [ 'emoji', 'twemoji' ].includes(node.type));
    if (emojis.length <= 25) {
      context._internal = {
        largeEmojis: true,
      };
    }
  }

  return <MessageASTNodes nodes={parsed} context={context} />;
}
// This function can probably be combined into the MessageSingleASTNode function
function MessageASTNodes({
  nodes,
  context,
}: {
  nodes: ASTNode;
  context: RenderContentContext;
}): React.JSX.Element {
  if (Array.isArray(nodes)) {
    return (
      <>
        {nodes.map((node, i) => (
          <MessageSingleASTNode node={node} context={context} key={i} />
        ))}
      </>
    );
  } else {
    return <MessageSingleASTNode node={nodes} context={context} />;
  }
}

export function MessageSingleASTNode({ node, context }: { node: SingleASTNode; context: RenderContentContext }) {
  if (!node) return null;

  const md = new MarkdownIt('zero')
    .enable([ 'heading', 'emphasis', 'link', 'autolink', 'strikethrough' ])
    .use(discordInlinePlugin, context);

  const type = node.type as RuleTypesExtended;

  switch (type) {
    case 'text': {
      const html = md.render(node.content)
        .replace(/\|\|([^\|]+)\|\|/g, (...match) => `<discord-spoiler>${match[ 1 ]}</discord-spoiler>`)
        .replace(/\n(?:<p>)?\-\#(.+)\n/gm, (...match) => `<span class="subtext">${match[ 1 ]}</span>`)
        .replace(/\`\`\`\n?(.+)\n?\`\`\`/gm, (...match) => `<discord-code-block>${match[ 1 ]}</discord-code-block>`)
        .replace(/\`(.+)\`/g, (...match) => `<discord-inline-code>${match[ 1 ]}</discord-inline-code>`)
      return htmlToReact(html);
    }

    case 'blockQuote':
      if (context.type === RenderType.REPLY) {
        return <MessageASTNodes nodes={node.content} context={context} />;
      }

      return (
        <DiscordQuote>
          <MessageASTNodes nodes={node.content} context={context} />
        </DiscordQuote>
      );

    case 'br':
    case 'newline':
      if (context.type === RenderType.REPLY) return ' ';
      return <br />;

    case 'channel': {
      const id = node.id as string;
      // Use the resolved channel name from profiles if available
      const channel = context.profiles?._channels?.[ id ];
      const isThread = channel && [ ChannelType.PrivateThread, ChannelType.PublicThread, ChannelType.AnnouncementThread ].includes(channel.type);
      const channelName = channel?.name || `${id}`;
      return (
        <DiscordMention type={isThread ? 'thread' : 'channel'}>
          {`${channelName}`}
        </DiscordMention>
      );
    }

    case 'role': {
      const id = node.id as string;
      // Use the resolved role name from profiles if available
      const role = context.profiles?._roles?.[ id ];
      const roleName = role?.name || `${id}`;
      return (
        <DiscordMention type="role">
          {`${roleName}`}
        </DiscordMention>
      );
    }

    case 'user': {
      const id = node.id as string;
      // Use the resolved username from profiles if available, otherwise fallback to ID
      const profile = context.profiles?.[ id ];
      const displayName = profile?.author || `User ${id}`;
      return <DiscordMention type="user">{`${displayName}`}</DiscordMention>;
    }

    case 'here':
    case 'everyone':
      return (
        <DiscordMention type={'role'} highlight>
          {`@${type}`}
        </DiscordMention>
      );

    case 'codeBlock':
      if (context.type !== RenderType.REPLY) {
        return <DiscordCodeBlock language={node.lang} code={node.content} />;
      }
      return <DiscordInlineCode>{node.content}</DiscordInlineCode>;

    case 'inlineCode':
      return <DiscordInlineCode>{node.content}</DiscordInlineCode>;

    case 'em':
      return (
        <DiscordItalic>
          <MessageASTNodes nodes={node.content} context={context} />
        </DiscordItalic>
      );

    case 'strong':
      return (
        <DiscordBold>
          <MessageASTNodes nodes={node.content} context={context} />
        </DiscordBold>
      );

    case 'underline':
      return (
        <DiscordUnderlined>
          <MessageASTNodes nodes={node.content} context={context} />
        </DiscordUnderlined>
      );

    case 'strikethrough':
      return (
        <s>
          <MessageASTNodes nodes={node.content} context={context} />
        </s>
      );

    case 'emoticon':
      return typeof node.content === 'string' ? (
        node.content
      ) : (
        <MessageASTNodes nodes={node.content} context={context} />
      );

    case 'spoiler':
      return (
        <DiscordSpoiler>
          <MessageASTNodes nodes={node.content} context={context} />
        </DiscordSpoiler>
      );

    case 'emoji':
    case 'twemoji':
      return (
        <DiscordCustomEmoji
          name={node.name}
          url={parseDiscordEmoji(node as APIMessageComponentEmoji)}
          embedEmoji={context.type === RenderType.EMBED}
          largeEmoji={context._internal?.largeEmojis}
        />
      );

    case 'timestamp':
      return <DiscordTime timestamp={parseInt(node.timestamp) * 1000} format={node.format} />;

    default: {
      console.log(`Unknown node type: ${type}`, node);
      return typeof node.content === 'string' ? (
        node.content
      ) : (
        <MessageASTNodes nodes={node.content} context={context} />
      );
    }
  }
}

export function getChannelType(channelType: ChannelType): 'channel' | 'voice' | 'thread' | 'forum' {
  switch (channelType) {
    case ChannelType.GuildCategory:
    case ChannelType.GuildAnnouncement:
    case ChannelType.GuildText:
      return 'channel';
    case ChannelType.GuildVoice:
    case ChannelType.GuildStageVoice:
      return 'voice';
    case ChannelType.PublicThread:
    case ChannelType.PrivateThread:
    case ChannelType.AnnouncementThread:
      return 'thread';
    case ChannelType.GuildForum:
      return 'forum';
    default:
      return 'channel';
  }
}
