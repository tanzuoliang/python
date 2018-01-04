/**
 * @Author: wbsifan
 * @Date:   2017-04-16T14:43:19+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 17-Jun-2017
 */
const querystring = require('querystring');
const urlParser = require("url");
const util = require("util");
const debug = require("debug")("wee:soap-server");
const http = require("http");

/**
 * 超时时间
 * @type {number}
 */
const DELAY_TIME = 10000;

class Ctx {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.data = {};
        this.error = null;
        this._end = false;
    }

    set(name, value = null) {
        if (wee.isObject(name)) {
            Object.assign(this.data, name);
        } else {
            this.data[name] = value;
        }
        return this;
    }

    setError(err) {
        this.error = err;
        return this;
    }

    end() {
        if (this._end) {
            return;
        }
        var args = {
            err: this.error && (this.error.message || this.error.toString()),
            data: this.data,
            pid: process.pid
        };
        this.res.end(wee.jsonEncode(args));
        this._end = true;
    }
}

class Server {
    constructor(config) {
        this.config = config;
        this.tokenKey = config.tokenKey || "";
        this.handlerMap = new Map();
        this.httpServer = http.createServer((req, res) => {
            this.parseRequest(req, res);
        });
    }

    static create(config) {
        return new this(config);
    }

    listen() {
        this.httpServer.listen(this.config);
    }

    setHandler(m, handler) {
        this.handlerMap.set(m, handler);
    }

    async parseRequest(req, res, cb) {
        var ctx = new Ctx(req, res);
        var query = urlParser.parse(req.url, true).query;
        var {
            m,
            a,
            rtime,
            token,
            param
        } = query;
        var checkToken = wee.md5([this.tokenKey, m, a, param, rtime].join(""), 8, 16);
        // 验证token
        if (token != checkToken) {
            return ctx.setError("error_token").end();
        }
        // 验证请求时间
        if (Math.abs(wee.time() - rtime) > DELAY_TIME) {
            return ctx.setError("error_rtime").end();
        }
        // 处理参数
        var args = [];
        if (param) {
            try {
                var args = wee.jsonDecode(param);
                if (!wee.isArray(args)) {
                    args = [args];
                }
            } catch (err) {
                return ctx.setError("error_param").end();
            }
        }
        debug("RequestParam", m, a, rtime, token, param, args);
        // 处理请求
        if (!this.handlerMap.has(m)) {
            return ctx.setError("module_not_exists").end();
        }
        var handler = this.handlerMap.get(m);
        if (typeof handler[a] != "function") {
            return ctx.setError("action_not_exists").end();
        }
        try {
            await handler[a](ctx, ...args);
            ctx.end();
        } catch (err) {
            ctx.setError(err).end();
        }
    }
}
module.exports = Server;
