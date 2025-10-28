export const onRequest = async (context) => {
  try {
    // ✅ Cloudflare env 전달 여부 확인용 로그
    console.log('ENV CHECK:', Object.keys(context.env || {}));
    return await context.next();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
