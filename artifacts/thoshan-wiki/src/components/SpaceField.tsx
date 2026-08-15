const stars = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 61) % 100}%`,
  delay: `${(index % 7) * -0.7}s`,
  size: index % 5 === 0 ? 2 : 1,
}));

const fallingStars = Array.from({ length: 8 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 29) % 84)}%`,
  delay: `${(index * 1.7) - 7}s`,
  duration: `${7 + (index % 4)}s`,
}));

export default function SpaceField({ variant = 'home' }: { variant?: 'home' | 'landing' }) {
  return <div className={`space-field space-field--${variant}`} aria-hidden="true">
    {stars.map((star) => <i key={star.id} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />)}
    {variant === 'landing' && <>
      <span className="space-satellite-float space-satellite-one"><b /></span>
      <span className="space-satellite-float space-satellite-two"><b /></span>
      <span className="space-moon" />
      {fallingStars.map((star) => <span key={star.id} className="space-falling-star" style={{ left: star.left, animationDelay: star.delay, animationDuration: star.duration }} />)}
    </>}
  </div>;
}
