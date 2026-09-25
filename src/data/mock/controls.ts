/**
 * Mock-mode controls — toggled from Settings → Developer / Demo.
 * Lets us demonstrate loading / empty / error states without a backend.
 */

const KEY_DELAY = 'dineiq.mock.delay';
const KEY_FAIL = 'dineiq.mock.fail';
const KEY_EMPTY = 'dineiq.mock.empty';

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function write(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export const mockControls = {
  get slowMode() { return read(KEY_DELAY); },
  set slowMode(v: boolean) { write(KEY_DELAY, v); },
  get failMode() { return read(KEY_FAIL); },
  set failMode(v: boolean) { write(KEY_FAIL, v); },
  get emptyMode() { return read(KEY_EMPTY); },
  set emptyMode(v: boolean) { write(KEY_EMPTY, v); },
};
