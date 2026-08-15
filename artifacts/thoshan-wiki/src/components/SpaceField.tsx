const stars = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 61) % 100}%`,
  delay: `${(index % 7) * -0.7}s`,
  size: index % 5 === 0 ? 2 : 1,
}));

export default function SpaceField() {
  return <div className="space-field" aria-hidden="true">{stars.map((star) => <i key={star.id} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />)}</div>;
}
