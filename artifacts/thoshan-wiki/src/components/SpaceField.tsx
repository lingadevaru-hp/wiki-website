const stars = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 61) % 100}%`,
  delay: `${(index % 7) * -0.7}s`,
  size: index % 5 === 0 ? 2 : 1,
}));

export default function SpaceField({ variant = 'home' }: { variant?: 'home' | 'landing' }) {
  return <div className={`space-field space-field--${variant}`} aria-hidden="true">
    {stars.map((star) => <i key={star.id} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />)}
    {variant === 'landing' && <>
      <span className="space-orbit space-orbit-one"><b className="space-satellite" /></span>
      <span className="space-orbit space-orbit-two"><b className="space-satellite" /></span>
      <span className="space-falling-star" />
    </>}
  </div>;
}
