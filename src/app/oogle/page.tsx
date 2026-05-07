import Link from "next/link";

import { OogleFeelingButton } from "@/components/oogle/OogleFeelingButton";
import { OogleLogo } from "@/components/oogle/OogleLogo";
import { OogleNavBar } from "@/components/oogle/OogleNavBar";
import {
  pickRandom,
  readButtonTexts,
  readMysteryDestinations,
} from "@/lib/oogle/read-seed-files";

export const dynamic = "force-dynamic"; // fresh random pick every request

const buttonCls =
  "rounded-sm border border-transparent bg-slate-100 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 hover:shadow-sm focus:outline-none";

export default async function OoglePage() {
  const buttonTexts   = readButtonTexts();
  const destinations  = readMysteryDestinations();
  const feelingPhrase = pickRandom(buttonTexts) ?? "I'm Feeling Lucky";

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* Decorative nav — top strip */}
      <div className="flex justify-end px-6 py-3">
        <OogleNavBar />
      </div>

      {/* Main — vertically centered */}
      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-4 pb-28">

        <OogleLogo />

        <p className="text-sm italic text-slate-400">
          we&rsquo;re keeping our eyes on you&hellip; yeah, YOU!
        </p>

        {/* Search form — OOgle Search button sits inside so it submits cleanly */}
        <form
          action="/oogle/results"
          method="GET"
          className="flex w-full max-w-xl flex-col items-center gap-5"
        >
          <input
            name="q"
            type="search"
            autoComplete="off"
            className="w-full rounded-full border border-slate-300 px-6 py-3 text-base text-slate-900 shadow-sm outline-none transition hover:shadow-md focus:border-blue-300 focus:shadow-md"
            aria-label="Search"
          />

          <div className="flex gap-3">
            <button type="submit" className={buttonCls}>
              OOgle Search
            </button>

            {/* Mystery button — type=button so it doesn't submit this form */}
            <OogleFeelingButton phrase={feelingPhrase} destinations={destinations} />
          </div>
        </form>

      </div>

      <footer className="w-full border-t border-slate-200 bg-slate-50 px-6 py-3 text-center text-xs text-slate-400">
        <Link href="/" className="hover:underline">RockStar Law</Link>
        {" · "}
        <Link href="/starbiz" className="hover:underline">StarBiz</Link>
        {" · "}
        <span>A government-portal simulator. Not the real thing.</span>
      </footer>
    </div>
  );
}
