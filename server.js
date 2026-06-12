(async () => {
  try {
    await import("./frontend/scripts/start-stack.mjs");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
