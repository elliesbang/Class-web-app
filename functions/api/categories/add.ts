const methodNotAllowed = () =>
  Response.json(
    {
      success: false,
      message: 'Not implemented: categories/add',
    },
    501,
  )

export const onRequest = async () => methodNotAllowed()
