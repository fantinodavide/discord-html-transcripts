import { ComponentType } from 'discord.js';
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
 * @param rawComponent - Raw component data or Discord.js component object
 * @returns Parsed V2 component or null if unsupported
 */
function parseV2Component(rawComponent: any): ComponentV2 | null {
  // Handle Discord.js component objects
  if (rawComponent.data) {
    const componentType = rawComponent.data.type;
    
    switch (componentType) {
      case ComponentType.Container: // ContainerComponent (Discord.js type 17)
        return parseDiscordJsContainer(rawComponent);
      case 10: // TextDisplayComponent (Discord.js type 10)
        return parseDiscordJsTextDisplay(rawComponent);
      case 13: // SeparatorComponent
        return parseDiscordJsSeparator(rawComponent);
      case 1: // ActionRow - handle as container
        return parseDiscordJsActionRow(rawComponent);
      default:
        console.warn(`Unknown Discord.js V2 component type: ${componentType}`);
        return null;
    }
  }

  // Handle raw component data (legacy)
  const componentType = rawComponent.type;
  switch (componentType) {
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
      console.warn(`Unknown V2 component type: ${componentType}`);
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
    (message.components && message.components.some((comp: any) => 
      comp.type >= 11 && comp.type <= 16 || // Raw component types
      comp.data?.type === 17 // Discord.js ContainerComponent
    ))
  );
}

// Discord.js component parsers
function parseDiscordJsContainer(containerComponent: any): ComponentV2 {
  const children: ComponentV2[] = [];
  
  // Parse nested components
  if (containerComponent.components) {
    for (const childComponent of containerComponent.components) {
      const parsed = parseV2Component(childComponent);
      if (parsed) {
        children.push(parsed);
      }
    }
  }
  
  // Convert accent_color from number to hex
  const accentColor = containerComponent.data.accent_color 
    ? `#${containerComponent.data.accent_color.toString(16).padStart(6, '0')}`
    : undefined;
  
  return {
    type: 12 as ComponentV2Type.Container, // Map to our Container type
    children,
    accent_color: accentColor,
  };
}

function parseDiscordJsTextDisplay(textComponent: any): ComponentV2 {
  return {
    type: 14 as ComponentV2Type.TextDisplay,
    content: textComponent.data.content || '',
    style: textComponent.data.style || 'paragraph',
  };
}

function parseDiscordJsSeparator(separatorComponent: any): ComponentV2 {
  return {
    type: 13 as ComponentV2Type.Separator,
    spacing: separatorComponent.data.spacing || 'medium',
  };
}

function parseDiscordJsActionRow(actionRowComponent: any): ComponentV2 {
  const children: ComponentV2[] = [];
  
  // Parse nested components in the action row
  if (actionRowComponent.components) {
    for (const childComponent of actionRowComponent.components) {
      const parsed = parseV2Component(childComponent);
      if (parsed) {
        children.push(parsed);
      }
    }
  }
  
  // Treat ActionRow as a container without accent color
  return {
    type: 12 as ComponentV2Type.Container,
    children,
  };
}