/**
 * Largest Triangle Three Buckets (LTTB) Downsampling Algorithm
 *
 * Reduces time-series data points while preserving visual shape.
 * Original paper: https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf
 *
 * @param {Array<{x: number, y: number}>} data - Input data points
 * @param {number} threshold - Target number of output points
 * @returns {Array<{x: number, y: number}>} Downsampled data points
 */
export function lttb(data, threshold) {
  if (threshold >= data.length || threshold === 0) {
    return data; // Nothing to do
  }

  const sampled = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always include first point
  sampled.push(data[0]);

  let a = 0; // Initially point a is the first point

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (used for slope calculation)
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Get the range for current bucket
    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length);

    // Point a
    const pointAX = data[a].x;
    const pointAY = data[a].y;

    let maxArea = -1;
    let maxAreaPoint = null;

    // Find point in current bucket that forms largest triangle with point A and average point
    for (let j = rangeOffs; j < rangeTo; j++) {
      // Calculate triangle area using determinant formula
      const area = Math.abs(
        (pointAX - avgX) * (data[j].y - pointAY) -
        (pointAX - data[j].x) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[j];
        a = j; // This point is the new "a" for next iteration
      }
    }

    sampled.push(maxAreaPoint);
  }

  // Always include last point
  sampled.push(data[data.length - 1]);

  return sampled;
}
