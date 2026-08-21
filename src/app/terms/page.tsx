import { LegalDoc, type LegalSection } from "@/components/LegalDoc";

export const metadata = { title: "Terms of Service — AfriCarrt" };

const sections: LegalSection[] = [
  {
    heading: "1. Introduction",
    body: [
      `These Terms of Service ("Terms") govern your access to and use of the AfriCarrt website and mobile application (the "Platform"), operated by BAYS Holding Inc., operating as AfriCarrt ("AfriCarrt," "we," "us," or "our"). AfriCarrt operates an online marketplace connecting independent African and Caribbean grocery stores ("Stores") with customers in the Toronto area ("Customers"). By creating an account or using the Platform, you agree to these Terms.`,
    ],
  },
  {
    heading: "2. What AfriCarrt Is (and Isn't)",
    body: [
      "AfriCarrt is a marketplace and delivery-coordination platform. We connect independent, third-party Stores with Customers, process payment on behalf of Stores, and coordinate delivery through third-party courier services (including Uber Direct).",
      "AfriCarrt does not grow, manufacture, import, or sell groceries itself.",
      "Each Store is an independent business responsible for the quality, safety, accuracy, and legality of the products it lists.",
      "AfriCarrt is not a courier and does not employ delivery drivers; deliveries are performed by independent third-party courier services.",
    ],
  },
  {
    heading: "3. Accounts",
    body: [
      "You must provide accurate information when creating an account and keep your login credentials secure. You are responsible for all activity under your account. AfriCarrt may suspend or terminate accounts that violate these Terms, provide false information, or engage in fraudulent or abusive behaviour.",
    ],
  },
  {
    heading: "4. Orders, Pricing & Payment",
    body: [
      "Prices are set by each Store and may differ from in-store pricing at that Store's discretion.",
      "At checkout, you will see and pay one combined total covering the item subtotal, any applicable delivery fee, and any service fee.",
      "Payment is processed securely through our payment processor (Stripe). AfriCarrt does not store your full payment card details.",
      "AfriCarrt retains a commission from each order; the remainder is remitted to the Store.",
      "Order confirmation does not guarantee item availability — Stores may need to substitute or cancel unavailable items, in which case you will be refunded for the affected item(s).",
    ],
  },
  {
    heading: "5. Delivery & Pickup",
    body: [
      "You may choose delivery or in-store pickup at checkout, where offered by a given Store.",
      "Delivery is fulfilled by independent third-party couriers. Estimated delivery times are estimates, not guarantees.",
      "You are responsible for providing an accurate delivery address and being reasonably available to receive your order.",
    ],
  },
  {
    heading: "6. Product Images & Descriptions",
    body: [
      "We make reasonable efforts to ensure product images and descriptions are accurate. However, actual products may vary from images shown due to packaging changes, substitutions, seasonal availability, or supplier updates.",
      "Product images are for illustrative purposes and may not reflect exact packaging, size, or brand variant received. Please refer to the product description for authoritative details, and contact the Store or AfriCarrt support with any concerns about a specific order.",
    ],
  },
  {
    heading: "7. Perishable, Non-Returnable & Returnable Items",
    body: [
      "Each product listed on AfriCarrt is marked by the Store as either perishable or non-perishable, and returnable or non-returnable, at the time of listing. As a general policy:",
      "Perishable items (including but not limited to fresh produce, frozen goods, dairy, and freshly prepared foods) are final sale once delivered or picked up, and are not eligible for return, unless the item arrived damaged, spoiled, or materially different from what was ordered.",
      "Shelf-stable, sealed, non-perishable items may be eligible for return or exchange, subject to the applicable Store's policy and Section 8 (Refunds) below.",
      "Items without an intact factory seal, or that have been opened, are not eligible for return, except where the item is defective or incorrect.",
    ],
  },
  {
    heading: "8. Item Availability & Substitutions",
    body: [
      "After you complete payment, there is a short hold period (currently 10 minutes) before your order is dispatched for delivery, during which the Store confirms it can fulfill your order in full.",
      "If an item you ordered is unavailable, you will be notified immediately and given the choice to select a substitute item or accept a partial refund for the unavailable item(s).",
      "If you do not respond within the notification window, the Store will pack and fulfill the remainder of your order, and you will automatically receive a partial refund for any unavailable item(s).",
      "This process applies before dispatch; once your order has been picked up for delivery, changes are no longer possible and Section 9 (Refunds & Cancellations) applies instead.",
    ],
  },
  {
    heading: "9. Returns, Refunds & Cancellations",
    body: [
      "If an order arrives damaged, incorrect, spoiled, or materially not as described, contact AfriCarrt support within 24 hours of delivery with your order number and, where possible, a photo of the issue.",
      "Approved refunds for damaged, incorrect, or spoiled items will be issued to your original payment method within a reasonable time.",
      "For eligible non-perishable, returnable items (see Section 7), returns or exchanges must be arranged directly with the Store that fulfilled your order, within the return window that Store specifies at the time of purchase. AfriCarrt does not itself process physical returns of goods; the Store is responsible for accepting the return and issuing any applicable resolution.",
      "Orders may be cancelled prior to a Store beginning to pack them; once packing has begun, cancellation may not be possible.",
      "AfriCarrt reserves the right to review refund requests on a case-by-case basis to prevent abuse of this policy.",
    ],
  },
  {
    heading: "10. Store Owner Terms",
    body: [
      "If you are a Store owner using AfriCarrt to list and sell products, you separately agree to the AfriCarrt Vendor Agreement, which governs your listing of products, compliance obligations, commission terms, and payout arrangements.",
    ],
  },
  {
    heading: "11. Prohibited Conduct",
    body: [
      "Providing false identity, business, or payment information.",
      "Attempting to circumvent AfriCarrt's payment system to avoid commission.",
      "Harassing, threatening, or abusing other users, Store owners, or couriers.",
      "Using the Platform for any unlawful purpose.",
    ],
  },
  {
    heading: "12. Disclaimers & Limitation of Liability",
    body: [
      `The Platform is provided "as is" and "as available." To the maximum extent permitted by law, AfriCarrt disclaims all warranties, express or implied, regarding the Platform, the Stores, and third-party courier services.`,
      "To the fullest extent permitted by law, AfriCarrt is not liable for any indirect, incidental, special, punitive, or consequential damages, or for any damages relating to physical injury, illness, or death, arising from products supplied by a Store or delivery performed by a third-party courier. AfriCarrt's total liability for any claim relating to your use of the Platform is limited to the amount you paid for the order giving rise to the claim.",
      "Some jurisdictions do not allow the exclusion or limitation of certain damages or implied warranties. In such jurisdictions, the above limitations apply only to the extent permitted by law, and do not affect any rights you have that cannot be excluded under applicable Canadian or provincial law.",
      "AfriCarrt is not liable for the acts or omissions of independent Stores or third-party couriers, except as required by applicable law.",
    ],
  },
  {
    heading: "13. Changes to These Terms",
    body: [
      "We may update these Terms from time to time. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.",
    ],
  },
  {
    heading: "14. Contact",
    body: ["Questions about these Terms can be directed to support@africarrt.com."],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Terms of Service</h1>
      <LegalDoc
        effectiveDate="August 21, 2026"
        subtitle="Customer & Store Owner Terms"
        disclaimer="This is a draft prepared for founder review — not a substitute for independent legal advice."
        sections={sections}
      />
    </div>
  );
}
