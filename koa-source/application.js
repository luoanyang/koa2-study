const EventEmitter = require('events');
const http = require('http');
const context = require('./context');
const response = require('./response');
const request = require('./request');

class Application extends EventEmitter {

  constructor() {
    super();
    this.context = context;
    this.request = request;
    this.response = response;
    this.middlewares = [];
  }
  /**
   * 组合中间件
   *
   * @returns
   */
  compose() {
    return async ctx => {
      function createNext(middleware, oldNext) {
        return async () => {
          await middleware(ctx, oldNext);
        };
      }

      let next = async () => {
        return Promise.resolve();
      }

      let len = this.middlewares.length;

      for (let i = len - 1; i >= 0; i--) {
        let currentMiddleware = this.middlewares[i];
        next = createNext(currentMiddleware, next);
      }
      await next();
    }
  }
  /**
   * 追加中间件
   *
   * @param {function} middleware -- 中间件
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  createContext(req, res) {
    const ctx = Object.create(this.context);
    ctx.request = Object.create(this.request);
    ctx.response = Object.create(this.response);
    ctx.req = ctx.request.req = req;
    ctx.res = ctx.response.res = res;
    return ctx;
  }

  responseBody(ctx) {
    let context = ctx.body;
    if (typeof context === 'string') {
      ctx.res.end(context);
    } else if (typeof context === 'object') {
      ctx.res.end(JSON.stringify(context));
    }
  }

  callBack() {
    return (req, res) => {
      let fn = this.compose();
      const ctx = this.createContext(req, res);
      const respond = () => this.responseBody(ctx);
      const onerror = err => this.onerror(err, ctx);
      return fn(ctx).then(respond).catch(onerror);
    }
  }

  listen(...args) {
    const server = http.createServer(this.callBack());
    server.listen(...args);
  }
  /**
   * 错误处理
   *
   * @param {object} err -- 错误信息
   * @param {object} ctx -- 执行上下文
   */
  onerror(err, ctx) {
    if (err.code === 'ENOENT') {
      ctx.status = 404;
    } else {
      ctx.status = 500;
    }

    let msg = err.message || '❌ koa2 error';
    ctx.res.end(msg);
    this.emit('error', err);
  }
}

module.exports = Application;