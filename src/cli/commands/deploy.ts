import { Command } from 'commander';

export const deployCommand = new Command('deploy')
  .description('Deploy the current project to AWS using Pulumi')
  .action(async () => {
    console.log('🚧 jetway deploy - Coming soon!');
    // TODO: Implement deployment logic
  }); 