const methodNotAllowed = () =>
  Response.json(
    {
      success: false,
      message: 'Not implemented: categories/update',
    },
    501,
  )

export const onRequest = async () => methodNotAllowed()
