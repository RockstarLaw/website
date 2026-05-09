"use client";

/**
 * ErrorSummary — IRS EIN wizard page-level validation error block
 *
 * DOM matches the literal capture at:
 *   IRS_Website/9_EIN WIZARD…/ERRORS PAGE LOOK/
 *   IRS Apply for an Employer Identification Number (EIN) online.html
 *
 * Text verbatim from irs-captures/json/ein__additionalDetails.json:
 *   pageErrorInputError1.errorMsg  → singular title
 *   pageErrorInputError2.errorMsg  → plural title ({{numberOfErrors}} interpolated)
 *   Both reference pageErrorInputError1.additionalText: [] → empty <ul> always rendered
 *
 * Trigger: Continue/submit click only (caller sets fieldErrors).
 * Focus management: focuses <h2 tabindex="-1"> via useLayoutEffect on empty→non-empty transition.
 */

import { useLayoutEffect, useRef } from "react";

interface Props {
  fieldErrors: string[];
}

export default function ErrorSummary({ fieldErrors }: Props) {
  const h2Ref       = useRef<HTMLHeadingElement>(null);
  const prevLenRef  = useRef(0);

  useLayoutEffect(() => {
    const prev = prevLenRef.current;
    const curr = fieldErrors.length;
    prevLenRef.current = curr;
    // Focus h2 only on transition from empty → non-empty
    if (prev === 0 && curr > 0) {
      h2Ref.current?.focus();
    }
  }, [fieldErrors.length]);

  if (fieldErrors.length === 0) return null;

  // Verbatim title strings from pageErrorInputError1 / pageErrorInputError2
  // Both have a trailing space — preserved as captured.
  const title =
    fieldErrors.length === 1
      ? "The following error has occurred: "
      : `The following ${fieldErrors.length} errors have occurred: `;

  return (
    <div aria-live="polite" className="_fixSectionAlert_l4b80_9">
      <div tabIndex={0} className="section-alert section-alert--red">

        {/* aria-hidden icon container — verbatim from capture */}
        <div aria-hidden="true" className="section-alert__icon">
          {/* 24×24 SVG — fill="#1B1B1B" verbatim from capture */}
          <svg
            data-testid="error-icon"
            className="error-icon"
            fill="#1B1B1B"
            focusable="false"
            viewBox="0 0 512 512"
            style={{ width: "24px", height: "24px" }}
          >
            <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM232 152C232 138.8 242.8 128 256 128s24 10.75 24 24v128c0 13.25-10.75 24-24 24S232 293.3 232 280V152zM256 400c-17.36 0-31.44-14.08-31.44-31.44c0-17.36 14.07-31.44 31.44-31.44s31.44 14.08 31.44 31.44C287.4 385.9 273.4 400 256 400z" />
          </svg>
        </div>

        <div className="section-alert__content">
          {/* h2 receives focus programmatically — tabIndex={-1} verbatim from capture */}
          <h2
            ref={h2Ref}
            className="section-alert__title section-alert__title-weighted"
            tabIndex={-1}
          >
            {title}
          </h2>

          {/* pageErrorInputError1.additionalText: [] → empty ul always rendered */}
          <ul className="_ulNoBullets_l4b80_1"></ul>

          {/* Error links — href="#" verbatim per spec */}
          <ol>
            {fieldErrors.map((msg, i) => (
              <li key={i}>
                <a
                  href="#"
                  aria-label={msg}
                  target="_self"
                  className="link link--blue link--no-padding"
                >
                  {msg}
                </a>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}
