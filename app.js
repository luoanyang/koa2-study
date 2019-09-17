const Koa = require('./koa-source/application');
const app = new Koa();

app.use(async (ctx, next) => {
  console.log(1);
  await next();
  console.log(5);
});

app.use(async (ctx, next) => {
  console.log(2);
  await next();
  console.log(4);
});

app.use(async ctx => {
  ctx.body = 'hello';
  console.log(3);
});

app.listen(3000, () => {
  console.log('service start port: http://localhost:3000');
});

app.on('error', err => {
  console.log('❌', err);
});