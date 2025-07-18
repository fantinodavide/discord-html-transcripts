import React from 'react';
import { ComponentV2Type } from '../../types';
import type {
  ComponentV2,
  SectionComponent,
  ContainerComponent,
  SeparatorComponent,
  TextDisplayComponent,
  ThumbnailComponent,
  MediaGalleryComponent,
} from '../../types';
import type { RenderMessageContext } from '..';
import { DiscordAttachments } from '@derockdev/discord-components-react';
import { 
  V2Container, 
  V2TextDisplay, 
  V2Separator, 
  V2Section, 
  V2Thumbnail, 
  V2MediaGallery 
} from './v2Components';

interface ComponentV2Props {
  component: ComponentV2;
  context: RenderMessageContext;
}

// Discord V2 Component Styles - reserved for future use
// const v2ContentStyles: React.CSSProperties = {
//   position: 'relative',
//   border: '1px solid #3f4147',
//   borderRadius: '8px',
//   padding: '16px',
//   backgroundColor: '#2f3136',
//   overflow: 'hidden',
// };


// const v2ButtonContainerStyles: React.CSSProperties = {
//   display: 'flex',
//   gap: '8px',
//   flexWrap: 'wrap',
//   marginTop: '12px',
// };

// Main V2 Components wrapper - use existing discord-components-react structure
export function ComponentsV2Wrapper({ components, context }: { components: ComponentV2[], context: RenderMessageContext }) {
  return (
    <DiscordAttachments slot="components">
      {components.map((component, index) => (
        <ComponentV2Renderer key={index} component={component} context={context} />
      ))}
    </DiscordAttachments>
  );
}

export default function ComponentV2Renderer({ component, context }: ComponentV2Props) {
  switch (component.type) {
    case ComponentV2Type.Section:
      return <SectionRenderer component={component} context={context} />;
    case ComponentV2Type.Container:
      return <ContainerRenderer component={component} context={context} />;
    case ComponentV2Type.Separator:
      return <SeparatorRenderer component={component} context={context} />;
    case ComponentV2Type.TextDisplay:
      return <TextDisplayRenderer component={component} context={context} />;
    case ComponentV2Type.Thumbnail:
      return <ThumbnailRenderer component={component} context={context} />;
    case ComponentV2Type.MediaGallery:
      return <MediaGalleryRenderer component={component} context={context} />;
    default:
      return <UnknownComponentRenderer component={component} />;
  }
}

function SectionRenderer({ component, context }: { component: SectionComponent; context: RenderMessageContext }) {
  return (
    <V2Section
      text={component.text}
      accessory={component.accessory ? <ComponentV2Renderer component={component.accessory} context={context} /> : undefined}
      context={context}
    />
  );
}

function ContainerRenderer({ component, context }: { component: ContainerComponent; context: RenderMessageContext }) {
  return (
    <V2Container accentColor={component.accent_color}>
      {component.children.map((child, index) => (
        <ComponentV2Renderer key={index} component={child} context={context} />
      ))}
    </V2Container>
  );
}

function SeparatorRenderer({ component }: { component: SeparatorComponent; context: RenderMessageContext }) {
  return <V2Separator spacing={component.spacing} />;
}

function TextDisplayRenderer({ component, context }: { component: TextDisplayComponent; context: RenderMessageContext }) {
  return (
    <V2TextDisplay
      content={component.content}
      style={component.style}
      context={context}
    />
  );
}

function ThumbnailRenderer({ component }: { component: ThumbnailComponent; context: RenderMessageContext }) {
  return (
    <V2Thumbnail
      url={component.url}
      altText={component.alt_text}
    />
  );
}

function MediaGalleryRenderer({ component }: { component: MediaGalleryComponent; context: RenderMessageContext }) {
  return <V2MediaGallery items={component.items} />;
}

function UnknownComponentRenderer({ component }: { component: ComponentV2 }) {
  return (
    <div 
      className="discord-v2-unknown-component"
      style={{
        padding: '8px',
        backgroundColor: '#ffeaa7',
        color: '#2d3436',
        borderRadius: '4px',
        margin: '4px 0',
        fontSize: '0.875rem',
      }}
    >
      Unknown component type: {component.type}
    </div>
  );
}