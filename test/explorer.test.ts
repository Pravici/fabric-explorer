import { FabricExplorer } from '../src';

test('Explorer', () => {
  const explorer = new FabricExplorer({
    networkConfig: {},
    channels: ['mychannel'],
  });
  expect(explorer).toBeDefined();
});
