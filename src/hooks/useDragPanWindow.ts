import { useEffect, useMemo, useRef, useState } from 'react';

interface DragPanOptions {
  dataLength: number;
  windowSize: number;
}

interface DragPanResult {
  start: number;
  end: number;
  setStart: (s: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  overlayHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onPointerCancel: () => void;
  };
  isDragging: boolean;
}

export function useDragPanWindow({ dataLength, windowSize }: DragPanOptions): DragPanResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const startIndexRef = useRef(0);

  const clampStart = (value: number) => {
    const maxStart = Math.max(0, dataLength - windowSize);
    return Math.max(0, Math.min(value, maxStart));
  };

  // Snap to most recent whenever data length or window size changes
  useEffect(() => {
    setStart(clampStart(dataLength - windowSize));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength, windowSize]);

  const pixelsPerItem = () => {
    const width = containerRef.current?.clientWidth || 1;
    return width / Math.max(windowSize, 1);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); // Ensure we capture drag on mobile
    setIsDragging(true);
    startXRef.current = e.clientX;
    startIndexRef.current = start;
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scroll from cancelling drag on touch
    const dx = e.clientX - startXRef.current;
    const deltaIndex = Math.round(dx / pixelsPerItem());
    // Dragging right (dx > 0) should reveal older data (move window left)
    const nextStart = clampStart(startIndexRef.current - deltaIndex);
    setStart(nextStart);
  };

  const endDrag = () => setIsDragging(false);

  const end = useMemo(() => Math.min(start + windowSize, dataLength), [start, windowSize, dataLength]);

  return {
    start,
    end,
    setStart: (s: number) => setStart(clampStart(s)),
    containerRef,
    overlayHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onPointerCancel: endDrag,
    },
    isDragging,
  };
}
