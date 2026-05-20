import type { ComponentType } from "react";
import F01Components from "./f01-components";
import F02Props from "./f02-props";
import F03State from "./f03-state";
import F04Effects from "./f04-effects";
import F05Events from "./f05-events";
import F06Rendering from "./f06-rendering";
import F07Forms from "./f07-forms";
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
import Module11 from "./11-react-compiler";
import Module12 from "./12-server-components";
import Module13 from "./13-server-actions";
import Module14 from "./14-use-hook";
import Module15 from "./15-partial-prerendering";
import Module16 from "./16-state-architecture";
import Module17 from "./17-browser-pipeline";
import Module18 from "./18-network-data";
import Module19 from "./19-microfrontends";
import Module20 from "./20-build-bundle";
import Module21 from "./21-accessibility";
import Module22 from "./22-observability";
import Module23 from "./23-memory-leaks";
import Module24 from "./24-security";
import Module25 from "./25-incident-simulator";

export const MODULE_COMPONENTS: Record<string, ComponentType> = {
  // Foundations
  "f01-components": F01Components,
  "f02-props": F02Props,
  "f03-state": F03State,
  "f04-effects": F04Effects,
  "f05-events": F05Events,
  "f06-rendering": F06Rendering,
  "f07-forms": F07Forms,
  // Core
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
  "11-react-compiler": Module11,
  "12-server-components": Module12,
  "13-server-actions": Module13,
  "14-use-hook": Module14,
  "15-partial-prerendering": Module15,
  "16-state-architecture": Module16,
  "17-browser-pipeline": Module17,
  "18-network-data": Module18,
  "19-microfrontends": Module19,
  "20-build-bundle": Module20,
  "21-accessibility": Module21,
  "22-observability": Module22,
  "23-memory-leaks": Module23,
  "24-security": Module24,
  "25-incident-simulator": Module25,
};
