import type { PlaceSpec, PropId } from 'common/scene/types';
import { POSITIONS } from 'common/visual-learning/data';
import type { Point, Position } from 'common/visual-learning/data';

export const DEFAULT_ROOM_POSITION = POSITIONS[2];

/** These areas follow the furniture, rather than assigning every point in the room a word. */
export const ROOM_ZONES = [
  { id: 'in', x: 116, y: 246, width: 86, height: 70 },
  { id: 'on', x: 298, y: 179, width: 185, height: 44 },
  { id: 'under', x: 318, y: 267, width: 145, height: 80 },
  // Accept the whole box and its edges, including drops near its base.
  { id: 'behind', x: 512, y: 240, width: 130, height: 105 },
  { id: 'between', x: 221, y: 279, width: 61, height: 70 },
] as const;

export function roomPositionAt(point: Point): Position | null {
  const zone = ROOM_ZONES.find((area) => point.x >= area.x && point.x <= area.x + area.width
    && point.y >= area.y && point.y <= area.y + area.height);
  return POSITIONS.find((position) => position.id === zone?.id) ?? null;
}

/** A preview does not submit text or change the saved scene. */
export type RoomPreview = { position: Position | null };

export function roomSpec(position: Position): PlaceSpec {
  return {
    kind: 'place', relation: position.id, figure: 'ball' as PropId,
    ground: (position.id === 'on' || position.id === 'under' ? 'table' : 'box') as PropId,
    ground2: position.id === 'between' ? 'table' as PropId : null,
    determiner: 'the', count: 1, adjective: null,
  };
}
