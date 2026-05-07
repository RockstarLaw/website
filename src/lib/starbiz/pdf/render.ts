/**
 * Server-side renderer for the Articles of Organization PDF.
 * @react-pdf/renderer's renderToBuffer runs in Node and returns a Buffer.
 */

import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import ArticlesOfOrganization, { type ArticlesData } from "./articles-of-organization";

export async function renderArticlesOfOrganization(data: ArticlesData): Promise<Buffer> {
  const element = createElement(ArticlesOfOrganization, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

export type { ArticlesData };
