// Slim rose header for signed-in pages: the title on top, key numbers and tabs along the bottom.
export default function PageHead({ title, sub, children }: { eyebrow?: string; title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="shell compact">
      <div className="pin">
        <div className="ph-top"><h1>{title}</h1>{sub && <p className="ph-sub">{sub}</p>}</div>
        {children && <div className="ph-bottom">{children}</div>}
      </div>
    </section>
  );
}
