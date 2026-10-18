/** Otsu: ambang optimal dari histogram luminansi 256 bin (fungsi murni). */
export function otsuThreshold(histogram: Uint32Array): number {
  let total = 0;
  let sum = 0;

  for (let i = 0; i < 256; i++) {
    total += histogram[i];
    sum += i * histogram[i];
  }

  if (total === 0) return 128;

  let sumBackground = 0;
  let weightBackground = 0;
  const variances = new Float64Array(256);
  let bestVariance = 0;

  for (let i = 0; i < 256; i++) {
    weightBackground += histogram[i];
    if (weightBackground === 0) continue;

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += i * histogram[i];

    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    variances[i] = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

    if (variances[i] > bestVariance) bestVariance = variances[i];
  }

  if (bestVariance === 0) return 128;

  const tolerance = bestVariance * 1e-6;
  let first = -1;
  let last = -1;

  for (let i = 0; i < 256; i++) {
    if (variances[i] >= bestVariance - tolerance) {
      if (first === -1) first = i;
      last = i;
    }
  }

  return Math.round((first + last) / 2) + 1;
}

/** Varians Laplacian: indikator ketajaman (0 = rata/blur). */
export function laplacianVariance(gray: Uint8Array, width: number, height: number): number {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const value =
        4 * gray[i] -
        gray[i - 1] -
        gray[i + 1] -
        gray[i - width] -
        gray[i + width];

      sum += value;
      sumSquares += value * value;
      count += 1;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  return sumSquares / count - mean * mean;
}
