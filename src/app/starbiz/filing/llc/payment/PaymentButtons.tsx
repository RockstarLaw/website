"use client";

/**
 * PaymentButtons — thin client wrapper for the payment page.
 *
 * The payment page is a server component; this island owns the interactive
 * cash-register buttons. Both simulate payment — no real processing occurs.
 */

import { useRouter } from "next/navigation";

import { CashRegisterButton } from "@/components/easter-eggs/CashRegisterButton";

const F = "Arial, Helvetica, sans-serif";

const sBtn: React.CSSProperties = {
  fontFamily: F,
  fontSize: "13px",
  padding: "4px 16px",
  cursor: "pointer",
};

interface Props {
  creditUrl: string;
  accountUrl: string;
}

export function PaymentButtons({ creditUrl, accountUrl }: Props) {
  const router = useRouter();

  return (
    <>
      {/* ── Credit Card button ────────────────────────────────────────────── */}
      <CashRegisterButton
        onConfirm={() => router.push(creditUrl)}
        style={sBtn}
      >
        Credit Card Payment
      </CashRegisterButton>

      {/* spacer */}
      <div style={{ height: "18px" }} />

      {/* ── Sunbiz E-file account fields + button ─────────────────────────── */}
      <table cellPadding={3} cellSpacing={0} style={{ margin: "0 auto" }}>
        <tbody>
          <tr>
            <td
              style={{
                fontFamily: F,
                fontSize: "12px",
                fontStyle: "italic",
                whiteSpace: "nowrap",
                textAlign: "center",
                paddingRight: "6px",
              }}
            >
              <label htmlFor="acct_number">Sunbiz E-file account number</label>
            </td>
            <td>
              <input
                type="text"
                size={12}
                maxLength={12}
                name="acct_number"
                id="acct_number"
                style={{
                  fontFamily: F,
                  fontSize: "12px",
                  border: "1px solid #999",
                  padding: "1px 3px",
                }}
              />
            </td>
          </tr>
          <tr>
            <td
              style={{
                fontFamily: F,
                fontSize: "12px",
                fontStyle: "italic",
                whiteSpace: "nowrap",
                textAlign: "center",
                paddingRight: "6px",
              }}
            >
              <label htmlFor="acct_password">Password</label>
            </td>
            <td>
              <input
                type="password"
                size={12}
                maxLength={12}
                name="acct_password"
                id="acct_password"
                style={{
                  fontFamily: F,
                  fontSize: "12px",
                  border: "1px solid #999",
                  padding: "1px 3px",
                }}
              />
            </td>
          </tr>
          <tr>
            <td
              style={{
                fontFamily: F,
                fontSize: "12px",
                fontStyle: "italic",
                whiteSpace: "nowrap",
                textAlign: "center",
                paddingRight: "6px",
              }}
            >
              <label htmlFor="email_addr">E-mail Address</label>
            </td>
            <td>
              <input
                type="text"
                size={20}
                maxLength={80}
                name="email_addr"
                id="email_addr"
                style={{
                  fontFamily: F,
                  fontSize: "12px",
                  border: "1px solid #999",
                  padding: "1px 3px",
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ height: "10px" }} />

      <table cellPadding={2} cellSpacing={0} style={{ margin: "0 auto" }}>
        <tbody>
          <tr>
            <td style={{ textAlign: "center" }}>
              <CashRegisterButton
                onConfirm={() => router.push(accountUrl)}
                style={sBtn}
              >
                Sunbiz E-file Account Payment
              </CashRegisterButton>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
