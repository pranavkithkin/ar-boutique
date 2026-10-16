export interface SizeMeasurement {
  size: string
  bust: number
  waist: number
  hip: number
  shoulder: string
  length: number
}

export const SIZE_CHART_DATA: SizeMeasurement[] = [
  { size: "S", bust: 36, waist: 32, hip: 39, shoulder: "14", length: 28 },
  { size: "M", bust: 38, waist: 34, hip: 41, shoulder: "14.5", length: 30 },
  { size: "L", bust: 40, waist: 36, hip: 43, shoulder: "15", length: 32 },
  { size: "XL", bust: 42, waist: 38, hip: 45, shoulder: "15.5", length: 34 },
]
