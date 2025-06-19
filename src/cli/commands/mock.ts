import { Command } from 'commander';

export const mockCommand = new Command('mock')
  .description('Serve mocked responses from your OpenAPI spec')
  .action(async () => {
    console.log('🚧 jetway mock - Coming soon!');
    // TODO: Implement mock server
  }); 