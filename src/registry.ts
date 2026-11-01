import { HEADER } from "./header.js";

export interface IconFile {
  componentName: string;
  fileName: string;
  folderName: string;
  path: string[];
}

/** `bold.logout`, `a.b.x` for a nested folder; an icon at the top takes the input folder's name. */
export function registryKey(file: IconFile): string {
  const base = file.fileName.replace(".tsx", "");
  return `${file.path.length ? file.path.join(".") : file.folderName}.${base}`;
}

export function registryCode(files: IconFile[]): string {
  const seen = new Map<string, string>();
  const entries = files.map((file) => {
    const base = file.fileName.replace(".tsx", "");
    const importPath = "./" + [...file.path, base].join("/");
    const key = registryKey(file);
    if (seen.has(key)) {
      throw new Error(`react-svg-icons: two icons have the name "${key}": ${seen.get(key)} and ${importPath}`);
    }
    seen.set(key, importPath);
    return `  "${key}": () => import("${importPath}").then((m) => m.${file.componentName}),`;
  });
  return `${HEADER}

export const iconRegistry = {
${entries.join("\n")}
} as const;

export type IconName = keyof typeof iconRegistry;
`;
}

export function iconComponentCode(defaultSize: number): string {
  return `${HEADER}
"use client";

import * as React from "react";
import { iconRegistry, type IconName } from "./registry";

export type IconProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "color" | "stroke" | "fill" | "strokeWidth" | "opacity"
> & {
  name: IconName;
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

const DEFAULT_ICON_PROPS = {
  size: ${defaultSize},
  color: "currentColor",
};

type RegistryLoader = (typeof iconRegistry)[IconName];
type ResolvedIconComponent = Awaited<ReturnType<RegistryLoader>>;
type LazyIconComponent = React.LazyExoticComponent<ResolvedIconComponent>;

// CRITICAL: React.lazy() must NEVER be called inside render — a fresh lazy
// wrapper type on every render makes React unmount the icon, re-suspend and
// remount it on every single parent render. Create one wrapper per icon
// name and reuse it for the lifetime of the app.
const lazyComponents = new Map<IconName, LazyIconComponent>();

const getLazyIcon = (name: IconName): LazyIconComponent | null => {
  const cached = lazyComponents.get(name);
  if (cached) return cached;

  const loader = iconRegistry[name];
  if (!loader) return null;

  const created = React.lazy(() =>
    loader().then((Component) => ({ default: Component })),
  ) as LazyIconComponent;
  lazyComponents.set(name, created);
  return created;
};

const IconBase = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, ...props }, ref) => {
    const LazyIcon = getLazyIcon(name);

    if (!LazyIcon) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(\`[Icon] Unknown icon name: "\${name}".\`);
      }
      return null;
    }

    const mergedProps = { ...DEFAULT_ICON_PROPS, ...props };
    const size = mergedProps.size ?? ${defaultSize};

    return (
      <React.Suspense
        fallback={
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={mergedProps.className}
            aria-hidden="true"
          />
        }
      >
        <LazyIcon ref={ref} {...mergedProps} />
      </React.Suspense>
    );
  }
);

IconBase.displayName = "Icon";

// Only export the lazy component here
export const Icon = IconBase;
export type { IconName };
`;
}
