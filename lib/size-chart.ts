export interface SizeMeasurement {
  size: string
  bust: number
  waist: number
  hip: number
  shoulder: string
}

export const SIZE_CHART_DATA: SizeMeasurement[] = [
  { size: "S", bust: 34, waist: 30, hip: 38, shoulder: "14" },
  { size: "M", bust: 36, waist: 32, hip: 40, shoulder: "14.5" },
  { size: "L", bust: 38, waist: 34, hip: 42, shoulder: "15" },
  { size: "XL", bust: 40, waist: 36, hip: 44, shoulder: "15.5" },
]
