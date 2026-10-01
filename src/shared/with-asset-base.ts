export function withAssetBase(
  assetPath: string,
  baseUrl: string = import.meta.env.BASE_URL,
): string {
  return `${baseUrl}${assetPath.replace(/^\//, '')}`
}
