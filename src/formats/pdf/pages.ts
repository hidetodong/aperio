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

export function spreadLayout(heights: number[], gap: number, columns: number): { top: number; row: number }[] {
  const cols = columns === 2 ? 2 : 1;
  const out = heights.map(() => ({ top: 0, row: 0 }));
  let y = 0;
  for (let i = 0; i < heights.length; i += cols) {
    let row = 0;
    for (let c = 0; c < cols && i + c < heights.length; c += 1) row = Math.max(row, heights[i + c] ?? 0);
    for (let c = 0; c < cols && i + c < heights.length; c += 1) out[i + c] = { top: y, row };
    y += row + (i + cols < heights.length ? gap : 0);
  }
  return out;
}

export function spreadHeight(layout: { top: number; row: number }[]): number {
  let height = 0;
  for (const box of layout) height = Math.max(height, box.top + box.row);
  return height;
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
