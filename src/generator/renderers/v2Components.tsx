import React from 'react';
import MessageContent, { RenderType } from './content';
import type { RenderMessageContext } from '..';

// Discord V2 Component implementations based on the actual Discord HTML structure

interface V2ContainerProps {
  accentColor?: string;
  children: React.ReactNode;
}

export function V2Container({ accentColor, children }: V2ContainerProps) {
  const containerStyle: React.CSSProperties = {
    width: '100%',
  };

  const contentStyle: React.CSSProperties = {
    border: '1px solid #3f4147',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#2f3136',
    position: 'relative',
    ...(accentColor && {
      borderLeft: `4px solid ${accentColor}`,
    }),
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

interface V2TextDisplayProps {
  content: string;
  style?: 'paragraph' | 'heading1' | 'heading2' | 'heading3';
  context: RenderMessageContext;
}

export function V2TextDisplay({ content, style = 'paragraph', context }: V2TextDisplayProps) {
  const getTextStyle = (): React.CSSProperties => {
    switch (style) {
      case 'heading1':
        return {
          fontSize: '2rem',
          fontWeight: '700',
          lineHeight: '1.25',
          color: '#ffffff',
          marginBottom: '8px',
          marginTop: '0',
        };
      case 'heading2':
        return {
          fontSize: '1.5rem',
          fontWeight: '600',
          lineHeight: '1.25',
          color: '#ffffff',
          marginBottom: '6px',
          marginTop: '0',
        };
      case 'heading3':
        return {
          fontSize: '1.25rem',
          fontWeight: '600',
          lineHeight: '1.25',
          color: '#ffffff',
          marginBottom: '4px',
          marginTop: '0',
        };
      default:
        return {
          fontSize: '16px',
          lineHeight: '1.375',
          color: '#dcddde',
          marginBottom: '8px',
        };
    }
  };

  return (
    <div style={getTextStyle()}>
      <MessageContent
        content={content}
        context={{ ...context, type: RenderType.NORMAL }}
      />
    </div>
  );
}

interface V2SeparatorProps {
  spacing?: 'small' | 'medium' | 'large';
}

export function V2Separator({ spacing = 'medium' }: V2SeparatorProps) {
  const getSpacing = () => {
    switch (spacing) {
      case 'small': return '8px';
      case 'large': return '24px';
      default: return '16px';
    }
  };

  return (
    <div style={{ margin: `${getSpacing()} 0` }}>
      <hr style={{ 
        border: 'none', 
        height: '1px', 
        backgroundColor: '#3f4147',
        margin: 0 
      }} />
    </div>
  );
}

interface V2SectionProps {
  text?: {
    content: string;
    style?: 'paragraph' | 'heading1' | 'heading2' | 'heading3';
  };
  accessory?: React.ReactNode;
  context: RenderMessageContext;
}

export function V2Section({ text, accessory, context }: V2SectionProps) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: '12px',
      marginBottom: '8px'
    }}>
      {text && (
        <div style={{ flex: 1 }}>
          <V2TextDisplay 
            content={text.content}
            style={text.style}
            context={context}
          />
        </div>
      )}
      {accessory && (
        <div>
          {accessory}
        </div>
      )}
    </div>
  );
}

interface V2ThumbnailProps {
  url: string;
  altText?: string;
}

export function V2Thumbnail({ url, altText }: V2ThumbnailProps) {
  return (
    <div>
      <img
        src={url}
        alt={altText || 'Thumbnail'}
        style={{
          maxWidth: '80px',
          maxHeight: '80px',
          borderRadius: '4px',
          objectFit: 'cover',
        }}
        loading="lazy"
      />
    </div>
  );
}

interface V2MediaGalleryProps {
  items: Array<{
    url: string;
    altText?: string;
    type: 'image' | 'video';
  }>;
}

export function V2MediaGallery({ items }: V2MediaGalleryProps) {
  const getGridColumns = (itemCount: number): number => {
    if (itemCount === 1) return 1;
    if (itemCount === 2) return 2;
    if (itemCount <= 4) return 2;
    return 3;
  };

  const gridColumns = getGridColumns(items.length);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
      gap: '4px',
      margin: '8px 0',
      maxWidth: '400px',
    }}>
      {items.map((item, index) => (
        <div key={index}>
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.altText || `Media ${index + 1}`}
              style={{
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '4px',
              }}
              loading="lazy"
            />
          ) : (
            <video
              src={item.url}
              style={{
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '4px',
              }}
              controls
              preload="metadata"
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface V2ButtonProps {
  label: string;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  onClick?: () => void;
}

export function V2Button({ label, style = 'secondary', disabled = false }: V2ButtonProps) {
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '500',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textDecoration: 'none',
      minHeight: '32px',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s ease',
    };

    switch (style) {
      case 'primary':
        return { ...baseStyle, backgroundColor: '#5865f2', color: '#ffffff' };
      case 'danger':
        return { ...baseStyle, backgroundColor: '#da373c', color: '#ffffff' };
      case 'success':
        return { ...baseStyle, backgroundColor: '#3ba55c', color: '#ffffff' };
      default:
        return { ...baseStyle, backgroundColor: '#4f545c', color: '#ffffff' };
    }
  };

  return (
    <button style={getButtonStyle()} disabled={disabled}>
      {label}
    </button>
  );
}

interface V2ButtonContainerProps {
  children: React.ReactNode;
}

export function V2ButtonContainer({ children }: V2ButtonContainerProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginTop: '12px',
    }}>
      {children}
    </div>
  );
}