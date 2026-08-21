import { LegalDoc, type LegalSection } from "@/components/LegalDoc";

export const metadata = { title: "Vendor Agreement — AfriCarrt" };

const sections: LegalSection[] = [
  {
    heading: "1. Parties & Purpose",
    body: [
      `This Vendor Agreement ("Agreement") is between BAYS Holding Inc., operating as AfriCarrt ("AfriCarrt"), and the Store owner listing products on the Platform ("Vendor," "you"). It governs your participation as an independent Store on the AfriCarrt marketplace.`,
    ],
  },
  {
    heading: "2. Independent Business Relationship",
    body: [
      "You are an independent business, not an employee, partner, or agent of AfriCarrt. You are solely responsible for the products you list, their quality and safety, their compliance with applicable food safety and business regulations, and the accuracy of your listings.",
    ],
  },
  {
    heading: "3. Eligibility & Verification",
    body: [
      "Before your Store is activated on the Platform, you must provide, and keep current, the following:",
      "Proof of business registration (e.g., Ontario Business Registry confirmation or Master Business Licence).",
      "A valid Toronto Retail Food Establishment licence (or applicable municipal equivalent), where required.",
      "Proof of a current food handler certification for at least one person responsible for order preparation, where applicable.",
      "Your HST/GST number, once applicable (see Section 9).",
      "A valid Certificate of Insurance for commercial general liability coverage, once available.",
      "AfriCarrt reserves the right to verify, reject, suspend, or deactivate any Store that does not meet or maintain these requirements.",
    ],
  },
  {
    heading: "4. Listings & Pricing",
    body: [
      "You are responsible for setting accurate prices, stock levels, and product descriptions for your listings.",
      "You may use AfriCarrt's shared product catalog as a starting point; suggested prices are non-binding defaults you may accept or override.",
      "You must keep stock levels reasonably accurate to avoid accepting orders you cannot fulfill.",
      "You are responsible for the accuracy of perishable/returnable flags on your listings, which determine the return policy shown to customers.",
    ],
  },
  {
    heading: "5. Product Images",
    body: [
      "Where AfriCarrt supplies a catalog image, actual products may vary slightly from the image shown (e.g., due to packaging updates). Where you upload your own product photos, you confirm you own or have the right to use those images, and grant AfriCarrt a licence to display them on the Platform.",
    ],
  },
  {
    heading: "6. Commission & Payment",
    body: [
      "AfriCarrt processes customer payment on your behalf via Stripe Connect.",
      "AfriCarrt's commission is calculated automatically each calendar month based on your Store's completed order volume in the prior calendar month, according to the following tiers:",
      "0–149 completed orders in the prior month: 15% commission",
      "150–299 completed orders in the prior month: 13% commission",
      "300+ completed orders in the prior month: 11% commission",
      "Your applicable rate is recalculated at the start of each calendar month based on the prior month's completed order count, and may move up or down accordingly. There is no manual approval required to move between tiers — the applicable rate is applied automatically based on your Store's own performance.",
      "Delivery fees collected from customers are used to cover third-party courier costs and are not part of your payout calculation.",
      "Payouts are subject to Stripe's standard processing and payout timelines.",
    ],
  },
  {
    heading: "7. Order Fulfillment & Item Availability",
    body: [
      "You must accept, prepare, and pack orders promptly upon receipt.",
      "AfriCarrt applies a short hold period (currently 10 minutes) after a customer completes payment, before the order is dispatched for delivery. During this window:",
      "If an item is unavailable, you must flag it through the Platform immediately so the customer can be notified and given the choice of a substitute or a partial refund.",
      "If the customer does not respond within the notification window, you must pack and fulfill the remainder of the order as instructed by the Platform; the customer will automatically receive a partial refund for the unavailable item(s), deducted from the order total before your payout is calculated.",
      "For delivery orders, your order must be ready for courier pickup within the timeframe communicated at checkout.",
    ],
  },
  {
    heading: "8. Store Performance Standards",
    body: [
      "AfriCarrt monitors Store performance, including late packing, cancellations, and stockouts, to maintain a reliable customer experience. Two enforcement mechanisms apply:",
      "Standard escalation: a first documented performance issue results in a warning; a second results in a temporary suspension of your Store; a third results in deactivation from the Platform.",
      "Severity override: regardless of the above, if more than 25% of your Store's orders in any rolling 30-day window involve a documented performance issue (late packing, cancellation, or stockout), AfriCarrt may immediately suspend your Store, bypassing the standard escalation sequence.",
      "AfriCarrt will make reasonable efforts to notify you of performance issues as they are recorded, so you have visibility before any enforcement action is taken.",
    ],
  },
  {
    heading: "9. Taxes",
    body: [
      "You are responsible for your own tax obligations, including registering for and remitting HST/GST once your revenue (through AfriCarrt or otherwise) exceeds the applicable threshold under Canadian law. AfriCarrt may request your HST/GST number for invoicing purposes once applicable.",
    ],
  },
  {
    heading: "10. Returns, Refunds & Disputes",
    body: [
      "You agree to honour AfriCarrt's customer-facing refund and item-availability policies (see Terms of Service, Sections 7–9) for orders placed through the Platform, including accurately flagging perishable and non-returnable items at the time of listing, and accepting direct customer returns for eligible non-perishable items within your stated return window.",
    ],
  },
  {
    heading: "11. Force Majeure",
    body: [
      "Neither party is liable for delays or failures in performance resulting from causes beyond its reasonable control, including but not limited to payment processor outages, courier service disruptions, extreme weather, power or internet outages, or other events of force majeure. The affected party will make reasonable efforts to notify the other and resume performance promptly once the condition is resolved.",
    ],
  },
  {
    heading: "12. Term & Termination",
    body: [
      "This Agreement remains in effect while your Store is active on the Platform. AfriCarrt may suspend or deactivate your Store at any time for violations of this Agreement, failure to maintain required compliance documentation, repeated customer complaints, food safety concerns, or as set out in Section 8. You may deactivate your Store at any time by notifying AfriCarrt.",
    ],
  },
  {
    heading: "13. Limitation of Liability",
    body: [
      "You agree to indemnify AfriCarrt against claims arising from your products, your business's compliance failures, or your negligence. AfriCarrt's liability to you is limited to unpaid amounts actually owed to you under this Agreement. To the fullest extent permitted by law, neither party is liable to the other for indirect, incidental, special, or consequential damages.",
    ],
  },
  {
    heading: "14. Contact",
    body: ["Questions about this Agreement can be directed to vendors@africarrt.com."],
  },
  {
    heading: "Acknowledgement",
    body: [
      "By checking the acceptance box when creating your Store on the Platform, the Vendor confirms they have read, understood, and agree to be bound by this AfriCarrt Vendor Agreement and the AfriCarrt Terms of Service. This electronic acceptance, along with the date it was recorded, is retained by AfriCarrt as your signature to this Agreement.",
    ],
  },
];

export default function VendorAgreementPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Vendor Agreement</h1>

      <div className="mt-6 rounded-2xl border border-sand bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-ink">Commission tiers (confirmed)</p>
        <p className="mt-1 text-xs text-ink/50">
          Recalculated automatically at the start of each calendar month, based on your Store&apos;s
          completed order count in the prior calendar month.
        </p>
        <table className="mt-3 w-full text-sm">
          <tbody>
            <tr className="border-t border-sand">
              <td className="py-1.5 text-ink/70">0–149 completed orders</td>
              <td className="py-1.5 text-right font-mono font-semibold text-terracotta">15%</td>
            </tr>
            <tr className="border-t border-sand">
              <td className="py-1.5 text-ink/70">150–299 completed orders</td>
              <td className="py-1.5 text-right font-mono font-semibold text-terracotta">13%</td>
            </tr>
            <tr className="border-t border-sand">
              <td className="py-1.5 text-ink/70">300+ completed orders</td>
              <td className="py-1.5 text-right font-mono font-semibold text-terracotta">11%</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm text-ink/70">
          Delivery fees are not shared with AfriCarrt. Your store&apos;s current rate is shown on your{" "}
          <a href="/store/payouts" className="font-medium text-terracotta hover:underline">
            payouts page
          </a>
          .
        </p>
      </div>

      <LegalDoc
        effectiveDate="August 21, 2026"
        subtitle="For Independent Store Owners on AfriCarrt"
        disclaimer="This is a draft prepared for founder review — not a substitute for independent legal advice."
        sections={sections}
      />
    </div>
  );
}
