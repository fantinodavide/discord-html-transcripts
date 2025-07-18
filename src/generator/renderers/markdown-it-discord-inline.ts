import { ChannelType } from 'discord.js';
import type MarkdownIt from 'markdown-it';

const rendererMap: Record<string, string> = {
  strong: 'discord-bold',
  em: 'discord-italic',
  u: 'discord-underline',
  s: 'discord-strikethrough',
  code: 'discord-inline-code',
};

/* -------------------------------------------------
   1)  Mentions  <@id>  <@&id>  <#id>
---------------------------------------------------*/
const mentionRule = (state: any, silent: any) => {
  const start = state.pos;
  if (state.src.charCodeAt(start) !== 0x3c) return false; // “<”

  const match = state.src.slice(start).match(/^<(@!?|@&|#)(\d+)>/);
  if (!match) return false;
  if (silent) return true;

  const token = state.push('discord_mention', '', 0);
  token.attrSet('kind', match[ 1 ] === '#' ? 'channel' : match[ 1 ].includes('&') ? 'role' : 'user');
  token.attrSet('id', match[ 2 ]);
  state.pos += match[ 0 ].length;
  return true;
};

/* -------------------------------------------------
   2)  Plugin factory
---------------------------------------------------*/
export const discordInlinePlugin: MarkdownIt.PluginWithOptions = (md, opts) => {
  const ctx = opts as any;

  /* --- parsers --- */
  md.inline.ruler.before('link', 'discord_mention', mentionRule);

  /* --- renderers --- */
  Object.entries(rendererMap).forEach(([ tag, ruleName ]) => {
    md.renderer.rules[ tag + '_open' ] = () => `<${ruleName}>`;
    md.renderer.rules[ tag + '_close' ] = () => `</${ruleName}>`;
  });

  md.renderer.rules.discord_mention = (tokens, idx) => {
    const kind = tokens[ idx ].attrGet('kind') as 'user' | 'channel' | 'role';
    const id = tokens[ idx ].attrGet('id')!;

    let resolvedName = id;

    if (kind === 'channel') {
      const c = ctx.profiles?._channels?.[ id ];
      const isThread =
        c && [ ChannelType.PrivateThread, ChannelType.PublicThread, ChannelType.AnnouncementThread ].includes(c.type);
      resolvedName = c?.name ?? id;
      return `<discord-mention type="${isThread ? 'thread' : 'channel'}" id="${resolvedName}"></discord-mention>`;
    }

    if (kind === 'role') {
      const r = ctx.profiles?._roles?.[ id ];
      resolvedName = r?.name ?? id;
      if (r?.color == '#000000')
        r.color = null;
      return `<discord-mention type="role" id="${resolvedName}" color="${r?.color}"></discord-mention>`;
    }

    // user
    const u = ctx.profiles?.[ id ];
    resolvedName = u?.author ?? `User ${id}`;
    return `<discord-mention type="user" id="${resolvedName}"></discord-mention>`;
  };

  /* ... existing renderers ... */
  md.renderer.rules.fence = (tokens, idx) => {
    const { content, info } = tokens[ idx ];
    return `<discord-code-block language="${info.trim()}">${content}</discord-code-block>`;
  };

  md.renderer.rules.code_inline = (tokens, idx) =>
    `<discord-inline-code>${tokens[ idx ].content}</discord-inline-code>`;

  md.renderer.rules.link_open = (tokens, idx) =>
    `<a href="${tokens[ idx ].attrGet('href')}" target="_blank" rel="noreferrer">`;
  md.renderer.rules.link_close = () => '</a>';
};