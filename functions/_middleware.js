// 🔄 Force Cloudflare Functions redeploy - ${new Date().toISOString()}
export const onRequest = async (context) => {
  // Cloudflare 환경 변수 전달 여부 확인 로그
  console.log("ENV CHECK:", Object.keys(context.env || {}));
  return await context.next();
};
