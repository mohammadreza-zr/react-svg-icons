import type { INode } from "svgson";
import { isColorLike, isTranslucentColorValue, type IconContext } from "./color.js";

export interface IconNode extends INode {
  mappedFill?: number;
  mappedStroke?: number;
  nativeOpacity?: number;
  nativeFillOpacity?: number;
  nativeStrokeOpacity?: number;
}

const IGNORE_ATTRS = new Set(["xmlns", "xmlns:xlink", "version", "style"]);
const ATTR_ALIAS: Record<string, string> = {
  class: "className",
  "xlink:href": "href",
  "xml:space": "xmlSpace",
};

export const escapeJsString = (value: unknown): string => JSON.stringify(String(value));

function camelize(name: string): string {
  return name.replace(/[-:](\w)/g, (_, c: string) => c.toUpperCase());
}

function toJsxAttributeName(name: string): string {
  if (name.startsWith("data-") || name.startsWith("aria-")) return name;
  if (ATTR_ALIAS[name]) return ATTR_ALIAS[name];
  return camelize(name);
}

export function attributeToJsx(name: string, value: unknown): string {
  if (IGNORE_ATTRS.has(name)) return "";
  const key = toJsxAttributeName(name);
  if (value === true) return `${key}=""`;
  if (value == null || value === false) return "";
  return `${key}={${escapeJsString(value)}}`;
}

export function transformNode(node: IconNode, ctx: IconContext, inheritedOpacity = 1): void {
  if (node.type !== "element") return;
  const attrs = node.attributes || {};
  let currentOpacity = inheritedOpacity;

  if (attrs.opacity != null) {
    const parsed = Number.parseFloat(attrs.opacity);
    if (Number.isFinite(parsed)) {
      node.nativeOpacity = parsed;
      currentOpacity *= parsed;
      delete attrs.opacity;
    }
  }

  if (node.name !== "svg") {
    const fillOpacityAttr = attrs["fill-opacity"] ?? attrs.fillOpacity;
    const strokeOpacityAttr = attrs["stroke-opacity"] ?? attrs.strokeOpacity;

    if (attrs.fill != null && isColorLike(attrs.fill)) {
      let fillOpacity = currentOpacity;
      let nativeFillOpacity = 1;
      if (fillOpacityAttr != null) {
        const p = Number.parseFloat(fillOpacityAttr);
        if (Number.isFinite(p)) {
          fillOpacity *= p;
          nativeFillOpacity = p;
        }
      }
      const isTranslucent = fillOpacity < 1 || isTranslucentColorValue(attrs.fill);
      node.mappedFill = ctx.getColorIndex(attrs.fill, isTranslucent);
      node.nativeFillOpacity = nativeFillOpacity < 1 ? nativeFillOpacity : undefined;
      delete attrs.fill;
      delete attrs["fill-opacity"];
      delete attrs.fillOpacity;
    }

    if (attrs.stroke != null && isColorLike(attrs.stroke)) {
      let strokeOpacity = currentOpacity;
      let nativeStrokeOpacity = 1;
      if (strokeOpacityAttr != null) {
        const p = Number.parseFloat(strokeOpacityAttr);
        if (Number.isFinite(p)) {
          strokeOpacity *= p;
          nativeStrokeOpacity = p;
        }
      }
      const isTranslucent = strokeOpacity < 1 || isTranslucentColorValue(attrs.stroke);
      node.mappedStroke = ctx.getColorIndex(attrs.stroke, isTranslucent);
      node.nativeStrokeOpacity = nativeStrokeOpacity < 1 ? nativeStrokeOpacity : undefined;
      delete attrs.stroke;
      delete attrs["stroke-opacity"];
      delete attrs.strokeOpacity;
    }

    delete attrs["stroke-width"];
    delete attrs.strokeWidth;
  }

  for (const child of node.children || []) transformNode(child as IconNode, ctx, currentOpacity);
}

export function nodeToJsx(node: IconNode, indent = 3): string {
  const pad = "  ".repeat(indent);
  if (node.type === "text") {
    const text = String(node.value || "").trim();
    if (!text) return "";
    return `${pad}{${escapeJsString(text)}}\n`;
  }
  if (node.type !== "element") return "";

  const attrParts = Object.entries(node.attributes || {})
    .map(([name, value]) => attributeToJsx(name, value))
    .filter(Boolean);
  const styleProps: string[] = [];

  const hasMappedFill = node.mappedFill !== undefined;
  const hasMappedStroke = node.mappedStroke !== undefined;
  const mappedIndex = hasMappedStroke ? node.mappedStroke : hasMappedFill ? node.mappedFill : undefined;

  if (hasMappedFill) {
    styleProps.push(`fill: colors?.[${node.mappedFill}] ?? fill ?? color ?? "currentColor"`);
  }
  if (hasMappedStroke) {
    styleProps.push(`stroke: colors?.[${node.mappedStroke}] ?? stroke ?? color ?? "currentColor"`);
  }

  if (mappedIndex !== undefined) {
    let baseOpacity = node.nativeOpacity ?? 1;
    if (hasMappedFill && node.nativeFillOpacity !== undefined) baseOpacity *= node.nativeFillOpacity;
    else if (hasMappedStroke && node.nativeStrokeOpacity !== undefined) baseOpacity *= node.nativeStrokeOpacity;

    if (baseOpacity !== 1) {
      styleProps.push(`opacity: opacities?.[${mappedIndex}] ?? opacity ?? ${baseOpacity}`);
    } else {
      styleProps.push(`opacity: opacities?.[${mappedIndex}] ?? opacity`);
    }
    attrParts.push(`strokeWidth={strokeWidths?.[${mappedIndex}] ?? strokeWidth}`);
  } else if (node.nativeOpacity !== undefined) {
    styleProps.push(`opacity: opacity ?? ${node.nativeOpacity}`);
  }

  if (styleProps.length > 0) attrParts.push(`style={{ ${styleProps.join(", ")} }}`);

  const openingAttrs = attrParts.length ? ` ${attrParts.join(" ")}` : "";
  const children = (node.children || []).map((child) => nodeToJsx(child as IconNode, indent + 1)).join("");
  if (!children.trim()) return `${pad}<${node.name}${openingAttrs} />\n`;
  return `${pad}<${node.name}${openingAttrs}>\n${children}${pad}</${node.name}>\n`;
}
