import { optimize } from "svgo";
import * as svgson from "svgson";
import type { INode } from "svgson";
import { collectColorInfo, createIconContext, isTranslucentColorValue, normalizeColor } from "./color.js";
import { HEADER } from "./header.js";
import { attributeToJsx, escapeJsString, nodeToJsx, transformNode, type IconNode } from "./jsx.js";

const parseSync: (svg: string) => INode =
  (svgson as { parseSync?: (svg: string) => INode }).parseSync ??
  (svgson as unknown as { default: { parseSync: (svg: string) => INode } }).default.parseSync;

export interface ComponentOptions {
  defaultSize: number;
  defaultStrokeWidth: number;
}

function optimizeSvg(svg: string): string {
  return optimize(svg, {
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: { overrides: { cleanupIds: false } },
      },
    ],
  }).data;
}

function walk(node: INode | undefined, fn: (node: INode) => void): void {
  if (!node) return;
  fn(node);
  for (const child of node.children || []) walk(child, fn);
}

function mostCommon(values: string[]): string | undefined {
  if (!values.length) return undefined;
  const counts = new Map<string, number>();
  let best = values[0];
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
    if (counts.get(value)! > (counts.get(best) || 0)) best = value;
  }
  return best;
}

export function generateComponentCode(
  rawSvg: string,
  componentName: string,
  file: string,
  options: ComponentOptions,
): string {
  let ast: INode;
  try {
    ast = parseSync(optimizeSvg(rawSvg));
  } catch (error) {
    throw new Error(`react-svg-icons: ${file} is not a valid SVG (${(error as Error).message})`);
  }
  const svgNode = (ast.name === "svg" ? ast : (ast.children || []).find((n) => n.name === "svg")) as
    | IconNode
    | undefined;
  if (!svgNode) throw new Error(`react-svg-icons: no <svg> root in ${file}`);
  svgNode.attributes = svgNode.attributes || {};

  const fallbackWidth = Number.parseFloat(svgNode.attributes.width || "24");
  const fallbackHeight = Number.parseFloat(svgNode.attributes.height || "24");
  const viewBox =
    svgNode.attributes.viewBox ||
    svgNode.attributes.viewbox ||
    `0 0 ${Number.isFinite(fallbackWidth) ? fallbackWidth : 24} ${Number.isFinite(fallbackHeight) ? fallbackHeight : 24}`;

  const strokeWidthValues: string[] = [];
  walk(svgNode, (node) => {
    if (node.type !== "element") return;
    const v = node.attributes?.["stroke-width"] ?? node.attributes?.strokeWidth;
    if (v != null) strokeWidthValues.push(String(v));
  });
  const commonStrokeWidth = mostCommon(strokeWidthValues);
  const parsedStrokeWidth =
    commonStrokeWidth == null ? options.defaultStrokeWidth : Number.parseFloat(commonStrokeWidth);
  const strokeWidthJsDefault = Number.isFinite(parsedStrokeWidth)
    ? parsedStrokeWidth
    : escapeJsString(commonStrokeWidth);

  const ctx = createIconContext(collectColorInfo(svgNode));

  const rootFill = svgNode.attributes.fill;
  const rootStroke = svgNode.attributes.stroke;

  let rootFillAttribute: string;
  if (rootFill == null || normalizeColor(rootFill) === "none" || normalizeColor(rootFill) === "transparent") {
    rootFillAttribute = `fill="none"`;
  } else {
    const index = ctx.getColorIndex(rootFill, isTranslucentColorValue(rootFill));
    rootFillAttribute = `fill={colors?.[${index}] ?? fill ?? color ?? "currentColor"}`;
  }

  let rootStrokeAttribute = "";
  if (rootStroke != null && normalizeColor(rootStroke) !== "none") {
    const index = ctx.getColorIndex(rootStroke, isTranslucentColorValue(rootStroke));
    rootStrokeAttribute = `stroke={colors?.[${index}] ?? stroke ?? color ?? "currentColor"}`;
  }

  for (const name of [
    "width", "height", "viewBox", "viewbox", "fill", "stroke",
    "stroke-width", "strokeWidth", "xmlns", "xmlns:xlink", "version", "style",
  ]) {
    delete svgNode.attributes[name];
  }

  transformNode(svgNode, ctx);

  const rootExtraAttrs = Object.entries(svgNode.attributes || {})
    .map(([name, value]) => attributeToJsx(name, value))
    .filter(Boolean)
    .join(" ");
  const childrenJsx = (svgNode.children || []).map((child) => nodeToJsx(child as IconNode, 3)).join("");
  const colorComment = ctx.colorSlots.length
    ? `/**\n * Original color slots:\n${ctx.colorSlots.map((slot, i) => ` * - colors[${i}] = ${slot}`).join("\n")}\n */\n`
    : "";

  const rootPropLines = [
    "ref={ref}",
    "width={size}",
    "height={size}",
    `viewBox={${escapeJsString(viewBox)}}`,
    rootFillAttribute,
    rootStrokeAttribute,
    rootExtraAttrs,
    `role={title ? "img" : undefined}`,
    `aria-hidden={title ? undefined : true}`,
    "{...props}",
  ]
    .filter(Boolean)
    .map((line) => `        ${line}`)
    .join("\n");

  return `${HEADER}${colorComment}import * as React from "react";

export type ${componentName}Props = Omit<
  React.SVGProps<SVGSVGElement>,
  "color" | "stroke" | "fill" | "strokeWidth" | "opacity"
> & {
  size?: number | string;
  color?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number | string;
  opacity?: number | string;
  colors?: (string | undefined)[];
  opacities?: (number | string | undefined)[];
  strokeWidths?: (number | string | undefined)[];
  title?: string;
};

export const ${componentName} = React.forwardRef<
  SVGSVGElement,
  ${componentName}Props
>(
  function ${componentName}(
    {
      size = ${options.defaultSize},
      color = "currentColor",
      stroke,
      fill,
      strokeWidth = ${strokeWidthJsDefault},
      opacity,
      colors,
      opacities,
      strokeWidths,
      title,
      ...props
    },
    ref
  ) {
    return (
      <svg
${rootPropLines}
      >
        {title ? <title>{title}</title> : null}
${childrenJsx}      </svg>
    );
  }
);
`;
}
