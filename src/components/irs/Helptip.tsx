"use client";

/**
 * Helptip — IRS EIN Wizard shared helptip component
 *
 * Replicates the IRS SPA helptip pattern exactly as it appears in the
 * captured HTML and as implemented inline in LegalStructureForm.tsx /
 * AddressForm.tsx for prior wizard steps.
 *
 * The helptip icon SVG path is verbatim from LegalStructureForm.tsx
 * (sourced from irs-captures/js/index-ChwXuGQH.js HelptipIconPath constant).
 *
 * Usage:
 *   <Helptip
 *     id="dbaNameHelp"
 *     ariaLabel="Trade Name help topic"
 *     title="Doing Business As Name"
 *     content="A trade name or doing business as name..."
 *   />
 *
 * Rendered inside the _fixHelptipStyling_bppll_24 span chain verbatim
 * from the IRS capture — callers wrap this component in that span chain.
 */

import { useState } from "react";

// Verbatim from LegalStructureForm.tsx — sourced from index-ChwXuGQH.js
const HELPTIP_ICON_PATH =
  "M9,18 C4.02943725,18 0,13.9705627 0,9 C0,4.02943725 4.02943725,0 9,0 C13.9705627,0 18,4.02943725 18,9 C18,13.9705627 13.9705627,18 9,18 Z M9,17 C13.418278,17 17,13.418278 17,9 C17,4.581722 13.418278,1 9,1 C4.581722,1 1,4.581722 1,9 C1,13.418278 4.581722,17 9,17 Z M10.5533462,12.1315042 L10.5533462,14.3230653 C10.5533462,14.5239584 10.3889794,14.6883256 10.1880863,14.6883256 L7.99652525,14.6883256 C7.79563216,14.6883256 7.63126489,14.5239584 7.63126489,14.3230653 L7.63126489,12.1315042 C7.63126489,11.9306111 7.79563216,11.7662444 7.99652525,11.7662444 L10.1880863,11.7662444 C10.3889794,11.7662444 10.5533462,11.9306111 10.5533462,12.1315042 Z M13.4389016,6.652602 C13.4389016,8.38758764 12.2609374,9.05418764 11.3934449,9.53815691 C10.8546858,9.84862855 10.5168203,10.4787022 10.5168203,10.743516 C10.5168203,10.9444091 10.3615845,11.181828 10.15156,11.181828 L7.95999889,11.181828 C7.7591058,11.181828 7.63126489,10.8713569 7.63126489,10.6704638 L7.63126489,10.2595462 C7.63126489,9.15463418 8.72704544,8.20495745 9.5306178,7.83969709 C10.2337436,7.52009455 10.5259518,7.21875491 10.5259518,6.63433855 C10.5259518,6.12297436 9.8593518,5.66639945 9.11970016,5.66639945 C8.70878253,5.66639945 8.33439071,5.79424036 8.13349762,5.93121273 C7.91434162,6.08644855 7.69518562,6.30560455 7.15642653,6.981336 C7.08337489,7.07265109 6.97379689,7.12743982 6.87335035,7.12743982 C6.79116671,7.12743982 6.71811453,7.10004545 6.64506235,7.05438818 L5.14749562,5.91294982 C4.99226035,5.79424036 4.95573398,5.59334727 5.05618053,5.42898 C6.04238307,3.79444091 7.4303718,3 9.29319889,3 C11.2473405,3 13.4389016,4.56148745 13.4389016,6.652602 Z";

export type HelptipDef = {
  id: string;
  title: string;
  additionalText: string[];
  ariaText?: string;
};

type HelptipProps = {
  def: HelptipDef;
  /** Unique instance id — used as the panel toggler correlation id */
  instanceId: string;
};

export default function Helptip({ def, instanceId }: HelptipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="_fixHelptipStyling_bppll_24 _fixHelptipStylingNotRequired_bppll_35">
      <span className="_helptipContent_1c7yk_2">
        <span className="helptip-group">
          <h3 className="helptip-button__button-wrapper">
            <button
              aria-expanded={open}
              aria-label={def.ariaText ?? `${def.title} help topic`}
              className="helptip-button"
              type="button"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="undefined " style={{ marginLeft: 0 }}>
                <span aria-hidden="true" style={{ marginLeft: 5 }}>
                  <svg
                    className="helptip-icon"
                    id={def.id}
                    data-testid="helptip-icon"
                    focusable="false"
                    height="16px"
                    width="16px"
                    viewBox="0 0 18 18"
                  >
                    <path
                      className={open ? "helptip-icon-path" : "helptip-icon-path"}
                      data-testid={open ? "helptip-open" : "helptip-closed"}
                      d={HELPTIP_ICON_PATH}
                    />
                  </svg>
                </span>
              </span>
            </button>
          </h3>
          {open && (
            <div className="helptip-panel" id={`${instanceId}-panel`} role="dialog" aria-label={def.title}>
              <button
                className="helptip-panel__close"
                type="button"
                aria-label={`Close ${def.title} help topic`}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
              <h4 className="helptip-panel__title">{def.title}</h4>
              {def.additionalText.map((chunk, i) => (
                <div
                  key={i}
                  className="helptip-panel__text"
                  dangerouslySetInnerHTML={{ __html: chunk }}
                />
              ))}
            </div>
          )}
        </span>
      </span>
    </span>
  );
}
