/**
 * The end of an exhaustive switch.
 *
 * Called with a value the compiler has narrowed to `never`, so adding an arm to
 * a union without handling it here is a compile error rather than a picture
 * that silently fails to draw. It throws at runtime too, because content loaded
 * from JSON can carry a `kind` TypeScript never saw.
 */
export function assertNever(value: never, context = 'value'): never {
  throw new Error(`Unhandled ${context}: ${JSON.stringify(value)}`);
}
