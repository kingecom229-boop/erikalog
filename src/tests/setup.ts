import { beforeEach } from 'vitest';
import '@testing-library/jest-dom';

beforeEach(() => {
  window.localStorage.clear();
});
