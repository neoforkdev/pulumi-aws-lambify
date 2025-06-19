import { Command } from 'commander';

export const destroyCommand = new Command('destroy')
  .description('Destroy all deployed infrastructure for this project')
  .action(async () => {
    console.log('🚧 jetway destroy - Coming soon!');
    // TODO: Implement destroy logic
  }); 