import { AttachmentBuilder, Message, MessageFlags } from 'discord.js';
import type { RenderMessageContext } from './generator';

export type AttachmentTypes = 'audio' | 'video' | 'image' | 'file';

export enum ExportReturnType {
  Buffer = 'buffer',
  String = 'string',
  Attachment = 'attachment',
}

export type ObjectType<T extends ExportReturnType> = T extends ExportReturnType.Buffer
  ? Buffer
  : T extends ExportReturnType.String
  ? string
  : AttachmentBuilder;

export type GenerateFromMessagesOptions<T extends ExportReturnType> = Partial<{
  /**
   * The type of object to return
   * @default ExportReturnType.ATTACHMENT
   */
  returnType: T;

  /**
   * Downloads images and encodes them as base64 data urls
   * @default false
   */
  saveImages: boolean;

  /**
   * Callbacks for resolving channels, users, and roles
   */
  callbacks: Partial<RenderMessageContext['callbacks']>;

  /**
   * The name of the file to return if returnType is ExportReturnType.ATTACHMENT
   * @default 'transcript-{channel-id}.html'
   */
  filename: string;

  /**
   * Whether to include the "Powered by discord-html-transcripts" footer
   * @default true
   */
  poweredBy: boolean;

  /**
   * The message right before "Powered by" text. Remember to put the {s}
   * @default 'Exported {number} message{s}.'
   */
  footerText: string;

  /**
   * Whether to show the guild icon or a custom icon as the favicon
   * 'guild' - use the guild icon
   * or pass in a url to use a custom icon
   * @default "guild"
   */
  favicon: 'guild' | string;

  /**
   * Whether to hydrate the html server-side
   * @default false - the returned html will be hydrated client-side
   */
  hydrate: boolean;
}>;

export type CreateTranscriptOptions<T extends ExportReturnType> = Partial<
  GenerateFromMessagesOptions<T> & {
    /**
     * The max amount of messages to fetch. Use `-1` to recursively fetch.
     */
    limit: number;

    /**
     * Filter messages of the channel
     * @default (() => true)
     */
    filter: (message: Message<boolean>) => boolean;
  }
>;

// Discord Components V2 types
export enum ComponentV2Type {
  Section = 11,
  Container = 12,
  Separator = 13,
  TextDisplay = 14,
  Thumbnail = 15,
  MediaGallery = 16,
}

export interface ComponentV2Base {
  type: ComponentV2Type;
}

export interface SectionComponent extends ComponentV2Base {
  type: ComponentV2Type.Section;
  text?: {
    content: string;
    style?: 'paragraph' | 'heading1' | 'heading2' | 'heading3';
  };
  accessory?: ComponentV2;
}

export interface ContainerComponent extends ComponentV2Base {
  type: ComponentV2Type.Container;
  children: ComponentV2[];
  accent_color?: string;
}

export interface SeparatorComponent extends ComponentV2Base {
  type: ComponentV2Type.Separator;
  spacing?: 'small' | 'medium' | 'large';
}

export interface TextDisplayComponent extends ComponentV2Base {
  type: ComponentV2Type.TextDisplay;
  content: string;
  style?: 'paragraph' | 'heading1' | 'heading2' | 'heading3';
}

export interface ThumbnailComponent extends ComponentV2Base {
  type: ComponentV2Type.Thumbnail;
  url: string;
  alt_text?: string;
}

export interface MediaGalleryComponent extends ComponentV2Base {
  type: ComponentV2Type.MediaGallery;
  items: Array<{
    url: string;
    alt_text?: string;
    type: 'image' | 'video';
  }>;
}

export type ComponentV2 =
  | SectionComponent
  | ContainerComponent
  | SeparatorComponent
  | TextDisplayComponent
  | ThumbnailComponent
  | MediaGalleryComponent;

// Utility function to check if a message uses Components V2
export function isComponentsV2Message(message: Message): boolean {
  return Boolean(message.flags?.has(MessageFlags.IsComponentsV2));
}
