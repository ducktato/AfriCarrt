import { LegalDoc, type LegalSection } from "@/components/LegalDoc";

export const metadata = { title: "Privacy Policy — AfriCarrt" };

const sections: LegalSection[] = [
  {
    heading: "1. Our Commitment to Your Privacy",
    body: [
      "AfriCarrt is committed to protecting your personal information in accordance with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). This policy explains what personal information we collect, why we collect it, how we use and protect it, and your rights regarding it.",
    ],
  },
  {
    heading: "2. What We Collect",
    body: [
      "Account information: name, email address, phone number, password (stored securely, never in plain text).",
      "Order information: delivery address, order history, items purchased.",
      "Payment information: processed directly by our payment processor (Stripe); AfriCarrt does not store your full card number.",
      "Store owner information: business name, business address, business registration/licence details, banking details for payouts (processed via Stripe Connect).",
      "Technical information: device type, browser, and usage data collected automatically to help us maintain and improve the Platform.",
    ],
  },
  {
    heading: "3. Why We Collect It",
    body: [
      "To create and manage your account.",
      "To process and fulfill your orders, including coordinating payment and delivery.",
      "To verify Store owners' business legitimacy before allowing them to list products.",
      "To communicate with you about your orders, account, or customer support requests.",
      "To improve the Platform and understand how it's used.",
      "To meet legal and regulatory obligations (e.g., tax reporting).",
    ],
  },
  {
    heading: "4. How We Share Your Information",
    body: [
      "We share limited information only as necessary to provide the service:",
      "With the Store you order from, to fulfill your order (e.g., items ordered, delivery address).",
      "With our payment processor (Stripe), to process payment and, for Store owners, payouts.",
      "With our delivery partner (Uber Direct), to coordinate and track delivery.",
      "With service providers who help us operate the Platform (e.g., hosting, email delivery), under confidentiality obligations.",
      "Where required by law, such as in response to a valid legal request.",
      "We do not sell your personal information to third parties.",
    ],
  },
  {
    heading: "5. How We Protect Your Information",
    body: [
      "We use industry-standard security practices, including encrypted connections, access controls, and secure third-party payment processing, to protect your personal information from unauthorized access, loss, or misuse.",
    ],
  },
  {
    heading: "6. Your Rights",
    body: [
      "Under PIPEDA, you have the right to:",
      "Access the personal information we hold about you.",
      "Request correction of inaccurate information.",
      "Withdraw consent for certain uses of your information, subject to legal or contractual restrictions.",
      "Request deletion of your account and associated personal information, subject to our legal obligation to retain certain records (e.g., transaction records for tax purposes).",
      "To exercise these rights, contact us at privacy@africarrt.com.",
    ],
  },
  {
    heading: "7. Data Retention",
    body: [
      "We retain personal information only as long as necessary to fulfill the purposes described in this policy, or as required by law (for example, financial records related to HST/GST obligations).",
    ],
  },
  {
    heading: "8. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. We will post the updated version with a new effective date.",
    ],
  },
  {
    heading: "9. Contact & Complaints",
    body: [
      "Questions or concerns about our privacy practices can be directed to privacy@africarrt.com. If you believe your privacy rights have been violated, you may also contact the Office of the Privacy Commissioner of Canada.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Privacy Policy</h1>
      <LegalDoc
        effectiveDate="August 21, 2026"
        subtitle="PIPEDA-Aligned Privacy Practices"
        disclaimer="This is a draft prepared for founder review — not a substitute for independent legal advice."
        sections={sections}
      />
    </div>
  );
}
