export const PDF_PAGE_HEIGHT = 842;
export const PDF_PAGE_GAP = 16;

export function pageOffset(heights: number[], index: number, gap: number): number {
  let top = 0;
  for (let i = 0; i < index; i += 1) top += (heights[i] ?? 0) + gap;
  return top;
}

export function documentHeight(heights: number[], gap: number): number {
  if (heights.length === 0) return 0;
  let total = 0;
  for (const height of heights) total += height;
  return total + gap * (heights.length - 1);
}

export function pagesInView(input: {
  scrollTop: number;
  viewHeight: number;
  heights: number[];
  gap: number;
}): number[] {
  const { scrollTop, viewHeight, heights, gap } = input;
  if (viewHeight <= 0 || heights.length === 0) return [];
  const end = scrollTop + viewHeight;
  const pages: number[] = [];
  let top = 0;
  for (let i = 0; i < heights.length; i += 1) {
    const height = heights[i] ?? 0;
    const bottom = top + height;
    if (height > 0 && bottom > scrollTop && top < end) pages.push(i + 1);
    top = bottom + gap;
  }
  return pages;
}
