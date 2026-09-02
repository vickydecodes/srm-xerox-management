import { Application } from 'express';
import listEndpoints from 'express-list-endpoints';
import chalk from 'chalk';
import pluralize from 'pluralize';

// Static Route Imports
import userRoute from '../modules/user/user.route.ts';
import shopRoute from '../modules/shop/shop.route.ts';
import settingRoute from '../modules/setting/setting.route.ts';
import serviceRoute from '../modules/service/service.route.ts';
import searchRoute from '../modules/search/search.route.ts';
import productRoute from '../modules/product/product.route.ts';
import orderRoute from '../modules/order/order.route.ts';
import inventoryProductRoute from '../modules/inventory-product/inventory-product.route.ts';
import departmentRoute from '../modules/department/department.route.ts';
import creditRoute from '../modules/credit/credit.route.ts';
import dashboardRoute from '../modules/dashboard/dashboard.route.ts';
import branchRoute from '../modules/branch/branch.route.ts';
import billRoute from '../modules/bill/bill.route.ts';
import authRoute from '../modules/auth/auth.route.ts';

const API_VERSION = 'v1';

export const loadRoutes = async (app: Application): Promise<void> => {
  const startTime = Date.now();

  console.log('\n' + chalk.bgBlue.white.bold(' 🚀 ROUTE LOADER INITIALIZING ') + '\n');

  const routes = [
    { name: 'user', router: userRoute },
    { name: 'shop', router: shopRoute },
    { name: 'setting', router: settingRoute },
    { name: 'service', router: serviceRoute },
    { name: 'search', router: searchRoute },
    { name: 'product', router: productRoute },
    { name: 'order', router: orderRoute },
    { name: 'inventory-product', router: inventoryProductRoute },
    { name: 'department', router: departmentRoute },
    { name: 'credit', router: creditRoute },
    { name: 'dashboard', router: dashboardRoute },
    { name: 'branch', router: branchRoute },
    { name: 'bill', router: billRoute },
    { name: 'auth', router: authRoute },
  ];

  console.log(
    chalk.cyanBright(
      `📦  Discovered ${chalk.bold(routes.length)} module${routes.length !== 1 ? 's' : ''}\n`
    )
  );

  let loaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, { name: fileName, router: defaultExport }] of routes.entries()) {
    try {
      const isRouter = defaultExport && typeof defaultExport === 'function';

      if (!isRouter) {
        skipped++;
        console.log(
          chalk.yellow(
            `⚠️  ${chalk.bold(fileName)} skipped (invalid router)`
          )
        );
        continue;
      }

      // We explicitly cast here to allow checking for a custom basePath if one was attached
      const customBasePath = (defaultExport as any).basePath;
      const basePath = customBasePath || `/${pluralize(fileName.replace(/_/g, '-').toLowerCase())}`;
      const baseRoute = `/api/${API_VERSION}${basePath}`;

      console.log(chalk.whiteBright(`\n[${index + 1}/${routes.length}] ${chalk.bold(fileName)}`));
      console.log(chalk.magentaBright(`   🔗 ${baseRoute}`));

      app.use(baseRoute, defaultExport);
      loaded++;

      const endpoints = listEndpoints(defaultExport as any);

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
