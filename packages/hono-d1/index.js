const DEFAULT_BINDING = 'DB'
const DEFAULT_STORE_KEY = 'd1'

const resolveOptions = init => {
  if (typeof init === 'string') {
    return { binding: init, storeKey: DEFAULT_STORE_KEY }
  }

  return {
    binding: init?.binding ?? DEFAULT_BINDING,
    storeKey: init?.storeKey ?? DEFAULT_STORE_KEY
  }
}

export const withD1 = init => {
  const { binding, storeKey } = resolveOptions(init)

  return async (c, next) => {
    const bindings = c.env || {}
    const database = bindings[binding]

    if (!database) {
      throw new Error(`D1 binding "${binding}" is not available in the current environment.`)
    }

    c.set(storeKey, database)
    await next()
  }
}

export default {
  withD1
}
