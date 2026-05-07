import { notFound } from "next/navigation";

import { StarBizShell } from "@/components/starbiz/StarBizShell";
import { StarBizSearchForm, type SearchType } from "@/components/starbiz/StarBizSearchForm";

const VALID_TYPES: SearchType[] = [
  "by-name",
  "by-document-number",
  "by-officer",
  "by-fei",
  "by-fictitious-owner",
  "by-trademark",
  "by-trademark-owner",
];

export default async function StarBizSearchPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!VALID_TYPES.includes(type as SearchType)) notFound();

  return (
    <StarBizShell>
      <StarBizSearchForm type={type as SearchType} />
    </StarBizShell>
  );
}
