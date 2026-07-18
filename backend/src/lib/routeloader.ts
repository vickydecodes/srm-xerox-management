import { glob } from 'glob';
import path from 'path';
import listEndpoints from 'express-list-endpoints';
import chalk from 'chalk';
import { Application } from 'express';
import pluralize from 'pluralize';

const API_VERSION = 'v1';

export const loadRoutes = async (app: Application): Promise<void> => {
  const startTime = Date.now();

  console.log('\n' + chalk.bgBlue.white.bold(' 🚀 ROUTE LOADER INITIALIZING ') + '\n');

  const routes = await glob('src/modules/**/*.route.ts', {
    ignore: ['node_modules/**', 'dist/**'],
  });

  console.log(
    chalk.cyanBright(
      `📦  Discovered ${chalk.bold(routes.length)} module${routes.length !== 1 ? 's' : ''}\n`
    )
  );

  let loaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, file] of routes.entries()) {
    const fileName = path.basename(file, '.route.ts');

    try {
      const fileUrl = new URL(`file://${path.resolve(file)}`).href;
      const mod = await import(fileUrl);

      const hasDefault = 'default' in mod;
      const isRouter = mod?.default && typeof mod.default === 'function';

      if (!hasDefault || !isRouter) {
        skipped++;
        console.log(
          chalk.yellow(
            `⚠️  ${chalk.bold(fileName)} skipped ${
              !hasDefault ? '(no default export)' : '(invalid router)'
            }`
          )
        );
        continue;
      }

      const basePath = mod.basePath || `/${pluralize(fileName.replace(/_/g, '-').toLowerCase())}`;
      const baseRoute = `/api/${API_VERSION}${basePath}`;

      console.log(chalk.whiteBright(`\n[${index + 1}/${routes.length}] ${chalk.bold(fileName)}`));

      console.log(chalk.gray(`   📂 ${file}`) + '\n' + chalk.magentaBright(`   🔗 ${baseRoute}`));

      app.use(baseRoute, mod.default);
      loaded++;

      const endpoints = listEndpoints(mod.default);

      if (!endpoints.length) {
        console.log(chalk.yellow('   ⚠️  No routes found\n'));
        continue;
      }

      endpoints.forEach((ep) => {
        const methodColor = ep.methods.includes('GET')
          ? chalk.green
          : ep.methods.includes('POST')
            ? chalk.blue
            : ep.methods.includes('PUT')
              ? chalk.yellow
              : ep.methods.includes('DELETE')
                ? chalk.red
                : chalk.cyan;

        const fullPath = ep.path === '/' ? baseRoute : `${baseRoute}${ep.path}`;

        console.log(
          '   ' + methodColor.bold(ep.methods.join(', ').padEnd(10)) + chalk.white(` → ${fullPath}`)
        );
      });

      console.log('');
    } catch (err: any) {
      failed++;
      console.log(chalk.red(`❌ ${chalk.bold(fileName)} failed`));
      console.log(chalk.red(`   ${err.message}\n`));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(chalk.gray('─'.repeat(60)));
  console.log(
    chalk.greenBright(`✔ Loaded: ${loaded}`) +
      chalk.yellow(`   ⚠ Skipped: ${skipped}`) +
      chalk.red(`   ✖ Failed: ${failed}`)
  );
  console.log(chalk.cyanBright(`⏱ Completed in ${duration}s\n`));
};
