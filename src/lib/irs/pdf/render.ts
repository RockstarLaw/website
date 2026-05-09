/**
 * Server-side renderer for IRS parody-PDF letters.
 * @react-pdf/renderer's renderToBuffer runs in Node and returns a Buffer.
 *
 * Pattern mirrors src/lib/starbiz/pdf/render.ts exactly.
 */

import { createElement }    from "react";
import { renderToBuffer }   from "@react-pdf/renderer";

import Cp575gDocument, { type Cp575gData } from "./cp575g";

export type { Cp575gData };

export async function renderCp575gPdf(data: Cp575gData): Promise<Buffer> {
  const element = createElement(Cp575gDocument, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}
