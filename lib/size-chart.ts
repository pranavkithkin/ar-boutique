export interface SizeMeasurement {
  size: string
  bust: number
  waist: number
  hip: number
  shoulder: string
}

export const SIZE_CHART_DATA: SizeMeasurement[] = [
  { size: "XS", bust: 32, waist: 28, hip: 36, shoulder: "13.5" },
  { size: "S", bust: 34, waist: 30, hip: 38, shoulder: "14" },
  { size: "M", bust: 36, waist: 32, hip: 40, shoulder: "14.5" },
  { size: "L", bust: 38, waist: 34, hip: 42, shoulder: "15" },
  { size: "XL", bust: 40, waist: 36, hip: 44, shoulder: "15.5" },
  { size: "XXL", bust: 42, waist: 38, hip: 46, shoulder: "16" },
  { size: "XXXL", bust: 44, waist: 40, hip: 48, shoulder: "16.5" },
]
