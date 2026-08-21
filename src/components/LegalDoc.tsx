export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalDoc({
  effectiveDate,
  subtitle,
  disclaimer,
  sections,
}: {
  effectiveDate: string;
  subtitle?: string;
  disclaimer?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mt-2">
      {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
      <p className="mt-1 text-sm text-ink/50">Effective Date: {effectiveDate}</p>
      {disclaimer && (
        <p className="mt-3 rounded-xl border border-sand bg-white px-4 py-2.5 text-xs italic text-ink/50">
          {disclaimer}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-lg font-semibold text-ink">{section.heading}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/70">
              {section.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
