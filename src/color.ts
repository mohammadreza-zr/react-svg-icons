import type { INode } from "svgson";

export interface ColorInfo {
  key: string;
  normalizedColor: string;
  value: string;
  count: number;
  firstOrder: number;
  isTranslucent: boolean;
}

export function normalizeColor(value: unknown): string {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

export function isColorLike(value: unknown): boolean {
  if (value == null) return false;
  const v = normalizeColor(value);
  if (!v) return false;
  if (["none", "transparent", "currentcolor", "inherit"].includes(v)) return false;
  if (v.startsWith("url(")) return false;
  return true;
}

export function isTranslucentColorValue(value: unknown): boolean {
  const v = normalizeColor(value);
  if (!v) return false;
  if (v.includes("rgba")) {
    const match = v.match(/rgba\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(",").map((p) => p.trim());
      if (parts.length === 4) {
        const a = Number.parseFloat(parts[3]);
        if (Number.isFinite(a) && a < 1) return true;
      }
    }
  }
  const slashAlpha = v.match(/\/\s*([0-9]*\.?[0-9]+)\s*\)/);
  if (slashAlpha) {
    const a = Number.parseFloat(slashAlpha[1]);
    if (Number.isFinite(a) && a < 1) return true;
  }
  return false;
}

export function collectColorInfo(svgNode: INode): ColorInfo[] {
  const infos = new Map<string, ColorInfo>();
  let firstOrder = 0;

  function register(value: unknown, opacityHint: number) {
    if (value == null) return;
    const normalized = normalizeColor(value);
    if (normalized === "currentcolor" || !isColorLike(value)) return;
    const isTranslucent = opacityHint < 1 || isTranslucentColorValue(value);
    const key = `${normalized}__${isTranslucent ? "alpha" : "solid"}`;
    if (!infos.has(key)) {
      infos.set(key, {
        key,
        normalizedColor: normalized,
        value: String(value),
        count: 0,
        firstOrder: firstOrder++,
        isTranslucent,
      });
    }
    infos.get(key)!.count += 1;
  }

  function visit(node: INode, inheritedOpacity: number) {
    if (node.type !== "element") return;
    const attrs = node.attributes || {};
    let currentOpacity = inheritedOpacity;
    if (attrs.opacity != null) {
      const p = Number.parseFloat(attrs.opacity);
      if (Number.isFinite(p)) currentOpacity *= p;
    }
    const fo = attrs["fill-opacity"] ?? attrs.fillOpacity;
    const so = attrs["stroke-opacity"] ?? attrs.strokeOpacity;
    if (attrs.fill != null) {
      let fo2 = currentOpacity;
      if (fo != null) {
        const p = Number.parseFloat(fo);
        if (Number.isFinite(p)) fo2 *= p;
      }
      register(attrs.fill, fo2);
    }
    if (attrs.stroke != null) {
      let so2 = currentOpacity;
      if (so != null) {
        const p = Number.parseFloat(so);
        if (Number.isFinite(p)) so2 *= p;
      }
      register(attrs.stroke, so2);
    }
    for (const child of node.children || []) visit(child, currentOpacity);
  }

  visit(svgNode, 1);
  return [...infos.values()];
}

export interface IconContext {
  colorSlots: string[];
  getColorIndex(originalColor: unknown, isTranslucent: boolean): number;
}

/**
 * Slot 0 is the most used opaque colour, then the other opaque ones, then the
 * translucent ones; equal counts keep the order they first appear in.
 */
export function createIconContext(colorInfos: ColorInfo[]): IconContext {
  const sorted = [...colorInfos].sort((a, b) => {
    if (a.isTranslucent !== b.isTranslucent) return a.isTranslucent ? 1 : -1;
    if (b.count !== a.count) return b.count - a.count;
    return a.firstOrder - b.firstOrder;
  });
  const colorIndex = new Map<string, number>();
  const colorSlots: string[] = [];
  sorted.forEach((info, index) => {
    colorIndex.set(info.key, index);
    colorSlots.push(info.value);
  });
  return {
    colorSlots,
    getColorIndex(originalColor, isTranslucent) {
      const normalized = normalizeColor(originalColor);
      const key = `${normalized}__${isTranslucent ? "alpha" : "solid"}`;
      if (colorIndex.has(key)) return colorIndex.get(key)!;
      const other = `${normalized}__${isTranslucent ? "solid" : "alpha"}`;
      if (colorIndex.has(other)) return colorIndex.get(other)!;
      const index = colorSlots.length;
      colorIndex.set(key, index);
      colorSlots.push(String(originalColor));
      return index;
    },
  };
}
