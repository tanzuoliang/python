/**
 * Created by wbsifan on 2017/1/18.
 */
"use strict";
const wee = require("weejs");
const kcp = require('node-kcp');
const dgram = require('dgram');
const Emitter = require('events').EventEmitter;


// int ikcp_nodelay(ikcpcb *kcp, int nodelay, int interval, int resend, int nc)
// nodelay ：是否启用 nodelay模式，0不启用；1启用。
// interval ：协议内部工作的 interval，单位毫秒，比如 10ms或者 20ms
// resend ：快速重传模式，默认0关闭，可以设置2（2次ACK跨越将会直接重传）
// nc ：是否关闭流控，默认是0代表不关闭，1代表关闭。
// 普通模式：`ikcp_nodelay(kcp, 0, 40, 0, 0);
// 极速模式： ikcp_nodelay(kcp, 1, 10, 2, 1);
/**
 * KCPServer kcp协议管理
 */
class KCPServer extends Emitter {
    constructor(opts = {}) {
        super();
        this._udpType = opts.udpType || 'udp4';
        this._interval = opts.interval || 10;
        this._conv = opts.conv || 123;
        this._wndsize = opts.wndsize || 128;
        this._offtime = opts.offtime || 60000;
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.server = dgram.createSocket(this._udpType);
        this.server.on('error', (err) => {
            this.emit("error", err);
            this.server.close();
        });
        this.server.on("message", (msg, rinfo) => {
            this.onMessage(msg, rinfo);
        });
        this.server.on('listening', () => {
            var address = this.server.address();
            console.log(`server listening ${address.address}:${address.port}`);

            setInterval(() => {
                this.update();
            }, this._interval);
        });

        this.clients = new Map();
    }

    /**
     * 向客户端发送消息
     * @param fd
     * @param msg
     * @returns {boolean}
     */
    send(fd, msg) {
        if (!this.clients.has(fd)) {
            wee.debug(`${fd} - fd_not_join`);
            return false;
        }
        var kcpobj = this.clients.get(fd);

        // 等待发送的包超过窗口一半  发送失败
        if (kcpobj.waitsnd() > this._wndsize / 2) {
            wee.debug(`${fd} - max_waitsnd`);
            return false;
        }

        kcpobj.send(msg);
        // 立即发送
        kcpobj.flush();
    }

    /**
     * 开启服务
     * @param port
     * @param host
     * @param callback
     */
    listen(port, host, callback) {
        this.server.bind(port, host, callback);
    }

    /**
     * 收到UDP消息
     * @param msg
     * @param rinfo
     */
    onMessage(msg, rinfo) {
        var fd = rinfo.address + ":" + rinfo.port;
        if (!this.clients.has(fd)) {
            var context = rinfo;
            var kcpobj = new kcp.KCP(this._conv, context);

            // 极速模式
            kcpobj.fd = fd;
            kcpobj.recvTime = Date.now();
            kcpobj.nodelay(1, this._interval, 2, 1);
            kcpobj.wndsize(this._wndsize);
            kcpobj.output((data, size, context) => {
                this.server.send(data, 0, size, context.port, context.address);
            });
            this.clients.set(fd, kcpobj);
            this.emit("connect", fd);
        }

        // 获取对象
        var kcpobj = this.clients.get(fd);
        kcpobj.input(msg);

        // 收到消息
        var recv = kcpobj.recv();
        if (recv) {
            kcpobj.recvTime = Date.now();
            this.emit("message", fd, recv);
        }
    }

    /**
     * 更新
     */
    update() {
        var now = Date.now();
        for (var [fd, kcpobj] of this.clients) {
            if (kcpobj.check(now) > 0) {
                continue;
            }
            kcpobj.update(now);
            // 断线
            if (now - kcpobj.recvTime > this._offtime) {
                this.emit("close", fd);
                this.clients.delete(fd);
            }
        }
    }
}

module.exports = {KCPServer};