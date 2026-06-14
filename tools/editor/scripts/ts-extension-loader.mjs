export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !specifierLooksLocal(specifier)) {
      throw error;
    }
    for (const extension of [".ts", ".tsx"]) {
      try {
        return await defaultResolve(`${specifier}${extension}`, context, defaultResolve);
      } catch {
        // Keep trying the next TypeScript extension before surfacing the original resolution error.
      }
    }
    throw error;
  }
}

function specifierLooksLocal(specifier) {
  return specifier.startsWith(".") || specifier.startsWith("/");
}
