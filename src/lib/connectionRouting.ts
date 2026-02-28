import type { Device, Connection, PortDef, DeviceDef } from "../types";

interface Rect {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Point {
  x: number;
  y: number;
}

const PADDING = 8;
const MARGIN = 14;

function segmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < rect.left || minX > rect.right || maxY < rect.top || minY > rect.bottom) {
    return false;
  }

  const edges: [Point, Point][] = [
    [{ x: rect.left, y: rect.top }, { x: rect.right, y: rect.top }],
    [{ x: rect.right, y: rect.top }, { x: rect.right, y: rect.bottom }],
    [{ x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom }],
    [{ x: rect.left, y: rect.bottom }, { x: rect.left, y: rect.top }],
  ];

  for (const [a, b] of edges) {
    if (segmentsIntersect(p1, p2, a, b)) return true;
  }

  if (pointInRect(p1, rect) || pointInRect(p2, rect)) return true;
  return false;
}

function pointInRect(p: Point, rect: Rect): boolean {
  return p.x > rect.left && p.x < rect.right && p.y > rect.top && p.y < rect.bottom;
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function onSegment(p: Point, q: Point, r: Point): boolean {
  return q.x <= Math.max(p.x, r.x) + 0.1 && q.x >= Math.min(p.x, r.x) - 0.1 &&
    q.y <= Math.max(p.y, r.y) + 0.1 && q.y >= Math.min(p.y, r.y) - 0.1;
}

function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;

  if (d1 === 0 && onSegment(p3, p1, p4)) return true;
  if (d2 === 0 && onSegment(p3, p2, p4)) return true;
  if (d3 === 0 && onSegment(p1, p3, p2)) return true;
  if (d4 === 0 && onSegment(p1, p4, p2)) return true;

  return false;
}

function getDeviceRect(device: Device, def: DeviceDef, deviceScale: number): Rect {
  const sw = def.w * (deviceScale / 100);
  const sh = def.h * (deviceScale / 100);
  return {
    id: device.id,
    left: device.x - sw / 2 - PADDING,
    top: device.y - sh / 2 - PADDING,
    right: device.x + sw / 2 + PADDING,
    bottom: device.y + sh / 2 + PADDING,
  };
}

export function getPortPosition(
  device: Device,
  portId: string,
  def: DeviceDef,
  ports: PortDef[],
  deviceScale: number
): Point {
  const sw = def.w * (deviceScale / 100);
  const sh = def.h * (deviceScale / 100);

  const portsByType: Record<string, PortDef[]> = { power: [], top: [], bottom: [], right: [] };
  ports.forEach((p) => {
    if (p.type === "AC" || p.type === "POWER") portsByType.power.push(p);
    else if (p.type === "LNET") portsByType.top.push(p);
    else if (p.type === "KB") portsByType.bottom.push(p);
    else if (p.type === "ETH") portsByType.right.push(p);
  });

  const port = ports.find(p => p.id === portId);
  if (!port) return { x: device.x, y: device.y };

  let position: "power" | "top" | "bottom" | "right" = "right";
  let index = 0;
  let total = 0;

  for (const [pos, group] of Object.entries(portsByType)) {
    const idx = group.findIndex(p => p.id === portId);
    if (idx !== -1) {
      position = pos as "power" | "top" | "bottom" | "right";
      index = idx;
      total = group.length;
      break;
    }
  }

  const deviceLeft = device.x - sw / 2;
  const deviceTop = device.y - sh / 2;
  const fraction = (index + 1) / (total + 1);

  switch (position) {
    case "power":
      return { x: deviceLeft, y: deviceTop + sh * fraction };
    case "top":
      return { x: deviceLeft + sw * fraction, y: deviceTop };
    case "bottom":
      return { x: deviceLeft + sw * fraction, y: deviceTop + sh };
    case "right":
      return { x: deviceLeft + sw, y: deviceTop + sh * fraction };
  }
}

type Dir = "left" | "right" | "up" | "down";

function getExitDirection(
  portPos: Point,
  device: Device,
  def: DeviceDef,
  deviceScale: number
): Dir {
  const sw = def.w * (deviceScale / 100);
  const sh = def.h * (deviceScale / 100);
  const cx = device.x;
  const cy = device.y;

  const distLeft = Math.abs(portPos.x - (cx - sw / 2));
  const distRight = Math.abs(portPos.x - (cx + sw / 2));
  const distTop = Math.abs(portPos.y - (cy - sh / 2));
  const distBottom = Math.abs(portPos.y - (cy + sh / 2));

  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
  if (minDist === distLeft) return "left";
  if (minDist === distRight) return "right";
  if (minDist === distTop) return "up";
  return "down";
}

function applyDir(p: Point, dir: Dir, dist: number): Point {
  switch (dir) {
    case "left": return { x: p.x - dist, y: p.y };
    case "right": return { x: p.x + dist, y: p.y };
    case "up": return { x: p.x, y: p.y - dist };
    case "down": return { x: p.x, y: p.y + dist };
  }
}

function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y);
  }
  return len;
}

function simplifyPath(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const next = points[i + 1];
    const curr = points[i];
    const sameX = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
    const sameY = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;
    if (sameX || sameY) continue;
    result.push(curr);
  }
  result.push(points[points.length - 1]);
  return result;
}

function countHitsRaw(
  points: Point[],
  rects: Rect[],
  skipFirstId?: string,
  skipLastId?: string
): number {
  let count = 0;
  const last = points.length - 2;
  for (let i = 0; i <= last; i++) {
    for (const rect of rects) {
      if (i === 0 && last > 0 && rect.id === skipFirstId) continue;
      if (i === last && last > 0 && rect.id === skipLastId) continue;
      if (segmentIntersectsRect(points[i], points[i + 1], rect)) count++;
    }
  }
  return count;
}

function buildCandidates(
  start: Point,
  end: Point,
  startDir: Dir,
  endDir: Dir,
  obstacles: Rect[],
  fromRect: Rect,
  toRect: Rect
): Point[][] {
  const candidates: Point[][] = [];
  const EXT = MARGIN;

  const se = applyDir(start, startDir, EXT);
  const ee = applyDir(end, endDir, EXT);

  candidates.push([start, se, { x: se.x, y: ee.y }, ee, end]);
  candidates.push([start, se, { x: ee.x, y: se.y }, ee, end]);

  const midX = (se.x + ee.x) / 2;
  const midY = (se.y + ee.y) / 2;
  candidates.push([start, se, { x: midX, y: se.y }, { x: midX, y: ee.y }, ee, end]);
  candidates.push([start, se, { x: se.x, y: midY }, { x: ee.x, y: midY }, ee, end]);

  const relevantRects = [fromRect, toRect, ...obstacles];
  const edgeYs: number[] = [];
  const edgeXs: number[] = [];
  for (const r of relevantRects) {
    edgeYs.push(r.top - MARGIN, r.bottom + MARGIN);
    edgeXs.push(r.left - MARGIN, r.right + MARGIN);
  }

  for (const y of edgeYs) {
    candidates.push([start, se, { x: se.x, y }, { x: ee.x, y }, ee, end]);
  }
  for (const x of edgeXs) {
    candidates.push([start, se, { x, y: se.y }, { x, y: ee.y }, ee, end]);
  }

  for (const y of edgeYs) {
    for (const x of edgeXs) {
      candidates.push([start, se, { x: se.x, y }, { x, y }, { x, y: ee.y }, ee, end]);
      candidates.push([start, se, { x, y: se.y }, { x, y }, { x: ee.x, y }, ee, end]);
    }
  }

  return candidates;
}

export function routeConnection(
  conn: Connection,
  devices: Device[],
  deviceDefs: Record<string, DeviceDef>,
  customSchematics: Record<string, { ports: PortDef[] }>,
  deviceScale: number
): string {
  const fromDev = devices.find(d => d.id === conn.fromId);
  const toDev = devices.find(d => d.id === conn.toId);
  if (!fromDev || !toDev) return "";

  const fromDef = deviceDefs[fromDev.part];
  const toDef = deviceDefs[toDev.part];
  if (!fromDef || !toDef) return "";

  const fromPorts = customSchematics[fromDev.part]?.ports || fromDef.ports;
  const toPorts = customSchematics[toDev.part]?.ports || toDef.ports;

  const start = getPortPosition(fromDev, conn.fromPort, fromDef, fromPorts, deviceScale);
  const end = getPortPosition(toDev, conn.toPort, toDef, toPorts, deviceScale);

  const allRects: Rect[] = [];
  let fromRect: Rect | null = null;
  let toRect: Rect | null = null;
  for (const dev of devices) {
    const def = deviceDefs[dev.part];
    if (!def) continue;
    const rect = getDeviceRect(dev, def, deviceScale);
    allRects.push(rect);
    if (dev.id === conn.fromId) fromRect = rect;
    if (dev.id === conn.toId) toRect = rect;
  }

  if (!fromRect || !toRect) return pointsToPath([start, end]);

  const fromId = conn.fromId;
  const toId = conn.toId;

  const thirdPartyRects = allRects.filter(r => r.id !== fromId && r.id !== toId);

  const directPath = [start, end];
  if (countHitsRaw(directPath, allRects) === 0) {
    return pointsToPath(directPath);
  }

  const startDir = getExitDirection(start, fromDev, fromDef, deviceScale);
  const endDir = getExitDirection(end, toDev, toDef, deviceScale);

  const candidates = buildCandidates(start, end, startDir, endDir, thirdPartyRects, fromRect, toRect);

  let bestPath = directPath;
  let bestHits = countHitsRaw(directPath, allRects);
  let bestLen = pathLength(directPath);

  for (const candidate of candidates) {
    const hits = countHitsRaw(candidate, allRects, fromId, toId);
    const len = pathLength(candidate);
    if (hits < bestHits || (hits === bestHits && len < bestLen)) {
      bestPath = candidate;
      bestHits = hits;
      bestLen = len;
    }
  }

  return pointsToPath(simplifyPath(bestPath));
}

function pointsToPath(points: Point[]): string {
  if (points.length === 0) return "";
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  return parts.join(" ");
}

export function getConnectionEndpoints(
  conn: Connection,
  devices: Device[],
  deviceDefs: Record<string, DeviceDef>,
  customSchematics: Record<string, { ports: PortDef[] }>,
  deviceScale: number
): { x1: number; y1: number; x2: number; y2: number } | null {
  const fromDev = devices.find(d => d.id === conn.fromId);
  const toDev = devices.find(d => d.id === conn.toId);
  if (!fromDev || !toDev) return null;

  const fromDef = deviceDefs[fromDev.part];
  const toDef = deviceDefs[toDev.part];
  if (!fromDef || !toDef) return null;

  const fromPorts = customSchematics[fromDev.part]?.ports || fromDef.ports;
  const toPorts = customSchematics[toDev.part]?.ports || toDef.ports;

  const start = getPortPosition(fromDev, conn.fromPort, fromDef, fromPorts, deviceScale);
  const end = getPortPosition(toDev, conn.toPort, toDef, toPorts, deviceScale);

  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}
