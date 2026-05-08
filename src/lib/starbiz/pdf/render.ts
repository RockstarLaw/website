/**
 * Server-side renderers for StarBiz filing PDFs.
 * @react-pdf/renderer's renderToBuffer runs in Node and returns a Buffer.
 */

import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";

import ArticlesOfOrganization, { type ArticlesData } from "./articles-of-organization";
import ArticlesOfIncorporation, { type ArticlesOfIncorporationData } from "./articles-of-incorporation";

export async function renderArticlesOfOrganization(data: ArticlesData): Promise<Buffer> {
  const element = createElement(ArticlesOfOrganization, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

export async function renderArticlesOfIncorporation(data: ArticlesOfIncorporationData): Promise<Buffer> {
  const element = createElement(ArticlesOfIncorporation, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any);
}

export type { ArticlesData, ArticlesOfIncorporationData };
