// The Ally mark: a bold "a." in a cream circle.
export default function Logo({ size = 46 }: { size?: number }) {
  return <span className="mark" role="img" aria-label="Ally" style={{ ["--s" as any]: size + "px" }}>a.</span>;
}
