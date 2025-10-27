const methodNotAllowed = () =>
  new Response(
    JSON.stringify({ success: false, message: 'Not implemented: categories/update-class' }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    },
  );

const errorResponse = (error) =>
  new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );

export const onRequest = async () => {
  try {
    return methodNotAllowed();
  } catch (error) {
    return errorResponse(error);
  }
};
