declare module "next/dist/lib/metadata/types/metadata-interface.js" {
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module "next/types.js" {
  export type * from "next";
}

declare module "next/dist/server/next.js" {
  const next: any;
  export default next;
}
