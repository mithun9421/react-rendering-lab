import type { ComponentType } from "react";
import Module01 from "./01-reconciliation";
import Module02 from "./02-diffing";
import Module03 from "./03-fiber";
import Module04 from "./04-concurrent";
import Module05 from "./05-time-slicing";
import Module06 from "./06-hydration";
import Module07 from "./07-streaming-ssr";
import Module08 from "./08-suspense";
import Module09 from "./09-islands";
import Module10 from "./10-virtualization";

export const MODULE_COMPONENTS: Record<string, ComponentType> = {
  "01-reconciliation": Module01,
  "02-diffing": Module02,
  "03-fiber": Module03,
  "04-concurrent": Module04,
  "05-time-slicing": Module05,
  "06-hydration": Module06,
  "07-streaming-ssr": Module07,
  "08-suspense": Module08,
  "09-islands": Module09,
  "10-virtualization": Module10,
};
