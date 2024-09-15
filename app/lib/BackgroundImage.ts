
const NUM_GRADIENTS = 3;

export function getRandomBackgroundImageUrl(): string {
  // Gradients are named as [index].jpg, 1-indexed
  const randomIndex = Math.floor(Math.random() * NUM_GRADIENTS) + 1;
  return `/img/gradients/${randomIndex}.jpg`;
}