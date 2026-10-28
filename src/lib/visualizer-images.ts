// Reference images for each orb style (hosted CDN)
export const VISUALIZER_IMAGES = {
  blackhole: "https://doop.design/a/A9MTlznuiL.jpg",
  supernova: "https://doop.design/a/8hnmZdBYEF.jpg",
  lightning: "https://doop.design/a/dUKtFAbx8F.jpg",
  glow: "https://doop.design/a/QDD2IpW75K.jpg",
  plasma: "https://doop.design/a/x35heXofJh.jpg",
} as const;

export type VisualizerImageKey = keyof typeof VISUALIZER_IMAGES;
