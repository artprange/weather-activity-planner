import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

import type { SearchPlaceType } from '@/features/places/placeSearch.schemas';

function LocationGlobe({ place }: { place: SearchPlaceType }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    // COBE reparents its canvas; keep its DOM inside an isolated React host.
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    container.append(canvas);
    let globe: ReturnType<typeof createGlobe> | undefined;
    let frame = 0;
    const resize = new ResizeObserver(() => {
      const width = container.clientWidth;
      globe?.update({ width, height: width });
    });
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: container.clientWidth,
        height: container.clientWidth,
        phi: -Math.PI / 2 - (place.longitude * Math.PI) / 180,
        theta: (place.latitude * Math.PI) / 180,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.45, 0.65, 0.8],
        markerColor: [1, 0.3, 0.1],
        glowColor: [0.25, 0.35, 0.45],
        markers: [
          {
            id: 'selected-location',
            location: [place.latitude, place.longitude],
            size: 0.06,
          },
        ],
      });
      // COBE v2 loads its map texture asynchronously without requesting a redraw.
      // Redraw the fixed view so the continents appear after the texture loads.
      const render = () => {
        globe?.update({});
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);
      resize.observe(container);
    } catch {
      // Coordinates remain available when WebGL cannot initialize.
      canvas.hidden = true;
    }
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      globe?.destroy();
      container.replaceChildren();
    };
  }, [place.latitude, place.longitude]);

  return (
    <figure className="mx-auto w-full max-w-44 shrink-0 rounded-xl border bg-card p-4 text-center">
      <div
        ref={containerRef}
        aria-hidden="true"
        className="aspect-square w-full"
      />
      <figcaption className="text-sm">
        <span className="block font-medium">{place.name}</span>
        <span className="text-muted-foreground">
          {Math.abs(place.latitude).toFixed(2)}°{' '}
          {place.latitude < 0 ? 'S' : 'N'} ·{' '}
          {Math.abs(place.longitude).toFixed(2)}°{' '}
          {place.longitude < 0 ? 'W' : 'E'}
        </span>
      </figcaption>
    </figure>
  );
}

export { LocationGlobe };
