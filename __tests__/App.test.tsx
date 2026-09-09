/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/navigation/RootNavigator', () => () => null);
jest.mock('../src/components/UnifiedLiquidGlassMenu', () => ({
  UnifiedLiquidGlassMenuProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
