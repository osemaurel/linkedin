import { forwardRef } from 'react';
import { SLIDE_HEIGHT, SLIDE_WIDTH, THEMES, type Slide, type ThemeId } from '@/lib/visuals';

type Props = {
  slide: Slide;
  index: number;
  total: number;
  theme: ThemeId;
  author: string;
};

const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Une diapositive à sa taille réelle (1080 × 1350), en styles en ligne pour l'export. */
export const CarouselSlide = forwardRef<HTMLDivElement, Props>(function CarouselSlide(
  { slide, index, total, theme, author },
  ref,
) {
  const t = THEMES.find((th) => th.id === theme) ?? THEMES[0];
  const first = index === 0;
  const last = index === total - 1;

  return (
    <div
      ref={ref}
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        background: t.bg,
        color: t.text,
        fontFamily: FONT,
        padding: 96,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, color: t.muted }}
      >
        <span style={{ fontWeight: 600 }}>{author}</span>
        <span>
          {index + 1}/{total}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {!first && (
          <div
            style={{
              width: 96,
              height: 10,
              borderRadius: 5,
              background: t.accent,
              marginBottom: 48,
            }}
          />
        )}
        <div
          style={{
            fontSize: first ? 92 : last ? 76 : 66,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: -1,
          }}
        >
          {slide.title}
        </div>
        {slide.body && (
          <div
            style={{
              marginTop: 48,
              fontSize: first ? 42 : 40,
              lineHeight: 1.45,
              color: first ? t.accent : t.text,
              opacity: first ? 1 : 0.9,
              whiteSpace: 'pre-line',
            }}
          >
            {slide.body}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: last ? 'flex-start' : 'flex-end',
          fontSize: 32,
          fontWeight: 600,
          color: t.accent,
        }}
      >
        {last ? author : first ? 'Faites défiler →' : '→'}
      </div>
    </div>
  );
});
