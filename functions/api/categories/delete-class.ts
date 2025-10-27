const methodNotAllowed = () =>
  Response.json(
    {
      success: false,
      message: 'Not implemented: categories/delete-class',
    },
    501,
  )

export const onRequest = async () => methodNotAllowed()
