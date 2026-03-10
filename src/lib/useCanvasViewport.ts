import { useCallback, useRef, useState } from "react";

export interface ViewState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.08;

export function useCanvasViewport() {
  const [viewState, setViewState] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewAtPanStartRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, zoom: 1 });

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      return {
        x: (localX - viewState.offsetX) / viewState.zoom,
        y: (localY - viewState.offsetY) / viewState.zoom,
      };
    },
    [viewState]
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: worldX * viewState.zoom + viewState.offsetX,
        y: worldY * viewState.zoom + viewState.offsetY,
      };
    },
    [viewState]
  );

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;

    setViewState((prev) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + delta));
      const zoomRatio = newZoom / prev.zoom;
      return {
        offsetX: mouseX - (mouseX - prev.offsetX) * zoomRatio,
        offsetY: mouseY - (mouseY - prev.offsetY) * zoomRatio,
        zoom: newZoom,
      };
    });
  }, []);

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      isPanningRef.current = true;
      panStartRef.current = { x: clientX, y: clientY };
      viewAtPanStartRef.current = { ...viewState };
    },
    [viewState]
  );

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return;
    const dx = clientX - panStartRef.current.x;
    const dy = clientY - panStartRef.current.y;
    setViewState({
      ...viewAtPanStartRef.current,
      offsetX: viewAtPanStartRef.current.offsetX + dx,
      offsetY: viewAtPanStartRef.current.offsetY + dy,
    });
  }, []);

  const endPan = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  const setZoomLevel = useCallback((newZoom: number) => {
    const container = containerRef.current;
    if (!container) {
      setViewState((prev) => ({ ...prev, zoom: newZoom }));
      return;
    }
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    setViewState((prev) => {
      const zoomRatio = newZoom / prev.zoom;
      return {
        offsetX: centerX - (centerX - prev.offsetX) * zoomRatio,
        offsetY: centerY - (centerY - prev.offsetY) * zoomRatio,
        zoom: newZoom,
      };
    });
  }, []);

  const resetView = useCallback(() => {
    setViewState({ offsetX: 0, offsetY: 0, zoom: 1 });
  }, []);

  const fitToContent = useCallback((contentWidth: number, contentHeight: number) => {
    const container = containerRef.current;
    if (!container || contentWidth <= 0 || contentHeight <= 0) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const padding = 40;
    const zoom = Math.min(
      (cw - padding * 2) / contentWidth,
      (ch - padding * 2) / contentHeight,
      2
    );
    setViewState({
      offsetX: (cw - contentWidth * zoom) / 2,
      offsetY: (ch - contentHeight * zoom) / 2,
      zoom,
    });
  }, []);

  const fitToBounds = useCallback((minX: number, minY: number, maxX: number, maxY: number) => {
    const container = containerRef.current;
    const w = maxX - minX;
    const h = maxY - minY;
    if (!container || w <= 0 || h <= 0) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const padding = 60;
    const newZoom = Math.min(
      (cw - padding * 2) / w,
      (ch - padding * 2) / h,
      2
    );
    setViewState({
      offsetX: (cw - w * newZoom) / 2 - minX * newZoom,
      offsetY: (ch - h * newZoom) / 2 - minY * newZoom,
      zoom: newZoom,
    });
  }, []);

  return {
    viewState,
    setViewState,
    containerRef,
    screenToWorld,
    worldToScreen,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    setZoomLevel,
    resetView,
    fitToContent,
    fitToBounds,
    isPanning: isPanningRef,
  };
}
