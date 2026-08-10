import {
  FLOOR,
  STAGE,
  centreX,
  fitWidth,
  round,
  rowOfN,
  shadowFor,
  standOnFloor,
} from 'common/scene/layout';

describe('layout', () => {
  it('fixes the stage once, at the numbers every prop is drawn against', () => {
    expect(STAGE).toEqual({ width: 720, height: 420 });
    expect(FLOOR).toBe(336);
  });

  describe('round', () => {
    it('keeps one decimal, which is finer than a pixel at this scale', () => {
      expect(round(12.34567)).toBe(12.3);
      expect(round(12.35)).toBe(12.4);
      expect(round(-0.04)).toBe(-0);
    });

    it('leaves a whole number alone', () => {
      expect(round(336)).toBe(336);
    });
  });

  it('centres a box on the stage', () => {
    expect(centreX(200)).toBe(260);
    expect(centreX(STAGE.width)).toBe(0);
  });

  it('stands a box on the floor, scaled', () => {
    expect(standOnFloor(150)).toBe(FLOOR - 150);
    expect(standOnFloor(150, 0.5)).toBe(FLOOR - 75);
  });

  describe('rowOfN', () => {
    const itemWidth = 64;
    const itemHeight = 64;

    it('puts one thing in the middle', () => {
      const [only] = rowOfN({ count: 1, itemWidth, itemHeight });

      expect(only?.x).toBe(centreX(itemWidth));
    });

    it('centres two and three the same way — around the stage centre', () => {
      for (const count of [2, 3]) {
        const spots = rowOfN({ count, itemWidth, itemHeight });
        const first = spots[0];
        const last = spots[spots.length - 1];
        const centre = ((first?.x ?? 0) + (last?.x ?? 0) + itemWidth) / 2;

        expect(round(centre)).toBe(STAGE.width / 2);
      }
    });

    it('spaces them by the gap', () => {
      const [a, b] = rowOfN({ count: 2, itemWidth, itemHeight, gap: 20 });

      expect((b?.x ?? 0) - (a?.x ?? 0)).toBe(itemWidth + 20);
    });

    it('stands them on the floor unless told otherwise', () => {
      expect(rowOfN({ count: 1, itemWidth, itemHeight })[0]?.y).toBe(FLOOR - itemHeight);
      expect(rowOfN({ count: 1, itemWidth, itemHeight, y: 100 })[0]?.y).toBe(100);
    });

    it('measures the gap in drawn width, not natural width, when scaled', () => {
      const [a, b] = rowOfN({ count: 2, itemWidth, itemHeight, scale: 0.5, gap: 10 });

      expect((b?.x ?? 0) - (a?.x ?? 0)).toBe(itemWidth * 0.5 + 10);
    });

    it('returns nothing for a count of zero rather than one thing at the centre', () => {
      expect(rowOfN({ count: 0, itemWidth, itemHeight })).toEqual([]);
    });

    it('rounds every coordinate it produces', () => {
      const spots = rowOfN({ count: 3, itemWidth: 63, itemHeight: 63, scale: 0.333 });

      for (const spot of spots) {
        expect(spot.x).toBe(round(spot.x));
        expect(spot.y).toBe(round(spot.y));
      }
    });
  });

  describe('shadowFor', () => {
    it('sits under the middle of the thing, just below the floor', () => {
      const s = shadowFor(100, 200);

      expect(s).toEqual({ cx: 200, cy: FLOOR + 3, rx: 100, ry: 7 });
    });

    it('narrows with the thing when it is scaled down', () => {
      expect(shadowFor(100, 200, 0.5).rx).toBe(50);
    });
  });

  describe('fitWidth', () => {
    it('shrinks to fit', () => {
      expect(fitWidth(150, 300)).toBe(0.5);
    });

    it('never enlarges — a chair drawn bigger to fill a gap is a different chair', () => {
      expect(fitWidth(600, 300)).toBe(1);
    });

    it('survives a zero-width prop', () => {
      expect(fitWidth(150, 0)).toBe(1);
    });
  });
});
