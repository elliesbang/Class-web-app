export async function uploadImage(env: any, base64: string): Promise<string> {
  // base64가 data-url 형태인지 체크
  if (!base64.startsWith("data:")) {
    throw new Error("Invalid image format");
  }

  // 지금은 Cloudflare Images 설정이 없으므로
  // base64 자체를 그대로 반환하여 DB에 저장
  return base64;
}
