import { useEffect, useRef } from "react";
import type { ViewState } from "../lib/useCanvasViewport";

interface CanvasBackgroundProps {
  viewState: ViewState;
  imageUrl: string | null;
  opacity: number;
  containerWidth: number;
  containerHeight: number;
}

export function CanvasBackground({
  viewState,
  imageUrl,
  opacity,
  containerWidth,
  containerHeight,
}: CanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const loadedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      imageRef.current = null;
      loadedUrlRef.current = null;
      return;
    }
    if (loadedUrlRef.current === imageUrl && imageRef.current) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      loadedUrlRef.current = imageUrl;
      renderCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const img = imageRef.current;
    if (!img) return;

    ctx.save();
    ctx.translate(viewState.offsetX, viewState.offsetY);
    ctx.scale(viewState.zoom, viewState.zoom);
    ctx.globalAlpha = opacity / 100;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    ctx.restore();
  };

  useEffect(() => {
    renderCanvas();
  }, [viewState, opacity, containerWidth, containerHeight]);

  useEffect(() => {
    if (imageRef.current) renderCanvas();
  }, [imageUrl]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    />
  );
}
