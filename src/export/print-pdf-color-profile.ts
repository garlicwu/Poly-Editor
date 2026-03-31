const printIccAssetPath = `${import.meta.env.BASE_URL}icc/print-default.icc`

export interface PrintPdfColorProfile {
  assetPath: string
  profileName: string
  outputConditionIdentifier: string
  outputCondition?: string
  info?: string
  registryName?: string
}

// Replace only this file and the asset under /public/icc when switching print profiles.
export const DEFAULT_PRINT_PDF_COLOR_PROFILE: PrintPdfColorProfile = {
  assetPath: printIccAssetPath,
  profileName: 'Coated FOGRA39',
  outputConditionIdentifier: 'FOGRA39',
  outputCondition: 'Coated FOGRA39',
  info: 'Coated FOGRA39 (ECI)',
  registryName: 'https://www.eci.org/',
}
