export default function ScrollBackground() {
  return (
    <div className="qx-scroll-background absolute inset-0 -z-10">
      <div className="qx-scroll-grid absolute inset-0" />
      <div className="qx-scroll-glow qx-scroll-glow-left" />
      <div className="qx-scroll-glow qx-scroll-glow-right" />
    </div>
  );
}
