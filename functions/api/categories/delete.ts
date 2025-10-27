const methodNotAllowed = () =>
  Response.json(
    {
      success: false,
      message: 'Not implemented: categories/delete',
    },
    501,
  )

export const onRequest = async () => methodNotAllowed()
