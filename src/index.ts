#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { fetchCentralBankReserves } from './bullion-client.js';
import { getPriceReports } from './prices.js';
import { displayReports, displayReserves } from './format.js';

const packageJson = createRequire(import.meta.url)('../package.json') as { version: string };

export function createProgram(): Command {
  const program = new Command();

  program
    .name('bullion')
    .description('Track precious metal spot prices with historical comparisons')
    .version(packageJson.version)
    .option('-a, --asset <name>', 'Asset to check (gold, XAU). Shows all if omitted.')
    .option('-m, --metal <name>', 'Alias for --asset')
    .option('-c, --currency <code>', 'Currency for prices (e.g. USD, EUR, GBP)', 'USD')
    .action(async () => {
      const opts = program.opts<{ asset?: string; metal?: string; currency?: string }>();
      displayReports(await getPriceReports(opts.asset ?? opts.metal, opts.currency));
    });

  program
    .command('reserves')
    .description('Show annual central-bank reserve values (Pro or Enterprise)')
    .option('--country <code>', 'Filter by ISO2 country code')
    .option('--start <year>', 'First observation year, inclusive')
    .option('--end <year>', 'Last observation year, inclusive')
    .action(async (options: { country?: string; start?: string; end?: string }) => {
      displayReserves(await fetchCentralBankReserves(options));
    });

  return program;
}

export async function run(argv = process.argv): Promise<void> {
  try {
    await createProgram().parseAsync(argv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${chalk.red('Error:')} ${message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) void run();
