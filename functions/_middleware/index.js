export const onRequest = async (context) => {
  try {
    return await context.next();
  } catch (error) {
    // console.debug('[Global API Error]', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
