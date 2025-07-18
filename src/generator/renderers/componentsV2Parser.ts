import type { ComponentV2, ComponentV2Type } from '../../types';

/**
 * Parser for Discord Components V2 data structure
 * This will parse the actual V2 component data from Discord messages
 * when Discord updates their API to include the new component structure
 */

// This represents the expected structure from Discord's API
interface DiscordV2ComponentData {
  type: number;
  [key: string]: any;
}

/**
 * Parse Discord V2 components from message data
 * @param rawComponents - Raw component data from Discord API
 * @returns Parsed V2 components
 */
export function parseV2Components(rawComponents: any[]): ComponentV2[] {
  const components: ComponentV2[] = [];
  
  for (const rawComponent of rawComponents) {
    const parsedComponent = parseV2Component(rawComponent);
    if (parsedComponent) {
      components.push(parsedComponent);
    }
  }
  
  return components;
}

/**
 * Parse a single V2 component from raw Discord data
 * @param rawComponent - Raw component data
 * @returns Parsed V2 component or null if unsupported
 */
function parseV2Component(rawComponent: DiscordV2ComponentData): ComponentV2 | null {
  switch (rawComponent.type) {
    case 11: // Section
      return parseSection(rawComponent);
    case 12: // Container
      return parseContainer(rawComponent);
    case 13: // Separator
      return parseSeparator(rawComponent);
    case 14: // TextDisplay
      return parseTextDisplay(rawComponent);
    case 15: // Thumbnail
      return parseThumbnail(rawComponent);
    case 16: // MediaGallery
      return parseMediaGallery(rawComponent);
    default:
      console.warn(`Unknown V2 component type: ${rawComponent.type}`);
      return null;
  }
}

function parseSection(rawComponent: DiscordV2ComponentData): ComponentV2 {
  const accessory = rawComponent.accessory ? parseV2Component(rawComponent.accessory) : undefined;
  return {
    type: 11 as ComponentV2Type.Section,
    text: rawComponent.text ? {
      content: rawComponent.text.content || '',
      style: rawComponent.text.style || 'paragraph'
    } : undefined,
    accessory: accessory || undefined,
  };
}

function parseContainer(rawComponent: DiscordV2ComponentData): ComponentV2 {
  return {
    type: 12 as ComponentV2Type.Container,
    children: rawComponent.children ? 
      rawComponent.children.map(parseV2Component).filter(Boolean) : [],
    accent_color: rawComponent.accent_color,
  };
}

function parseSeparator(rawComponent: DiscordV2ComponentData): ComponentV2 {
  return {
    type: 13 as ComponentV2Type.Separator,
    spacing: rawComponent.spacing || 'medium',
  };
}

function parseTextDisplay(rawComponent: DiscordV2ComponentData): ComponentV2 {
  return {
    type: 14 as ComponentV2Type.TextDisplay,
    content: rawComponent.content || '',
    style: rawComponent.style || 'paragraph',
  };
}

function parseThumbnail(rawComponent: DiscordV2ComponentData): ComponentV2 {
  return {
    type: 15 as ComponentV2Type.Thumbnail,
    url: rawComponent.url || '',
    alt_text: rawComponent.alt_text,
  };
}

function parseMediaGallery(rawComponent: DiscordV2ComponentData): ComponentV2 {
  return {
    type: 16 as ComponentV2Type.MediaGallery,
    items: rawComponent.items || [],
  };
}

/**
 * Check if a message has V2 components
 * @param message - Discord message object
 * @returns true if message has V2 components
 */
export function hasV2Components(message: any): boolean {
  // Check for V2 flag and component structure
  return Boolean(
    message.flags?.has?.(1 << 15) || // IS_COMPONENTS_V2 flag
    (message.components && message.components.some((comp: any) => comp.type >= 11 && comp.type <= 16))
  );
}