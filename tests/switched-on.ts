import { test as plainTest } from 'claude-code/testing'
import type { TestBody, TestOptions, TestRest } from 'claude-code/testing'

/**
 * `test` with the session starting with stretchtext on, as for a reader who turned it on, unless the
 * test's own options set `startOn`.
 */
export const test = (name: string, ...rest: TestRest): void => {
  const [given, body]: readonly [TestOptions, TestBody] = rest.length === 1 ? [{}, rest[0]] : rest
  plainTest(name, { ...given, options: { startOn: true, ...given.options } }, body)
}
