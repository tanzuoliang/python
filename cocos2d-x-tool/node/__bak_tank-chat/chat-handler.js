/**
 * @Author: wbsifan
 * @Date:   2017-01-20T16:25:39+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 25-Sep-2017
 */



/**
 * Created by wbsifan on 2016/12/23.
 */
"use strict";
// 加载配置文件
const config = require("./config");
const wee = require("weejs");
const proto = require("./proto");
const manage = require("./manage");
const dbModel = require("./db-model");
const debug = require("debug")("wee:chat-handler");
const RedisClient = require("ioredis");
const util = require("util");
const roomHandler = require("./room-handler");
const locker = require("weejs/locker").create(manage.redis);
const Remote = require("weejs/remote");

/**
 * 客户端命令
 */
class Handler {
    constructor() {
        // 注册
        this.remote = Remote.create({
            subRedis: manage.subRedis,
            pubRedis: manage.pubRedis
        }, manage.REMOTE_CHAT_NSP);
        // 发送给所有玩家
        this.remote.on("sendAll", (msg) => {
            for (let [fd, uid] of manage.fdUidList) {
                manage.send(fd, msg);
            }
        });

        // 发送公告
        this.remote.on("sendBoard", (data) => {
            var msg = proto.notice(data);
            for (let [fd, uid] of manage.fdUidList) {
                manage.send(fd, msg);
            }
        });

        // 发送消息通知
        this.remote.on("sendNotice", (uid, data) => {
            var msg = proto.notice(data);
            var fd = manage.getFd(uid);
            if (fd) {
                manage.send(fd, msg);
            }
        });

        // 发送给指定UID
        this.remote.on("sendUid", (uid, msg) => {
            var fd = manage.getFd(uid);
            if (fd) {
                manage.send(fd, msg);
            }
        });

        // 发送给指定FD
        this.remote.on("sendFd", (fd, msg) => {
            manage.send(fd, msg);
        });

        // 在其它设备登陆
        this.remote.on("otherLogin", (uid, fd) => {
            var tarFd = manage.getFd(uid);
            if (tarFd == fd) {
                manage.clearUidFd(uid, fd);
                manage.send(fd, proto.error("user_other_login"));
            }
        });
    }

    /**
     * 生成新的链接
     * @param  {[type]} ws
     * @return {Promise}
     */
    async execOpen(ws) {
        ws.fd = manage.makeFd();
        manage.fdSocketList.set(ws.fd, ws);
        debug("execOpen FD = ", ws.fd);
    }

    /**
     * 连接半闭
     * @param {any} ws
     * @returns
     */
    async execClose(ws) {
        if (!ws.fd) {
            return;
        }
        var fd = ws.fd;
        this.logout(fd);
        manage.fdSocketList.delete(fd);
    }

    /**
     * 执行客户端命令
     * @param {any} ws
     * @param {any} data
     * @returns
     */
    async execClient(ws, data) {
        var token = data.substr(0, 16);
        var message = data.substr(16);
        var msgArr = JSON.parse(message);
        var [rtime, action, args] = msgArr;
        var checkToken = wee.md5(config.clientToken + message, 8, 16);
        debug("execClient:", token, rtime, action, args, checkToken);
        if (checkToken != token) {
            debug("errorToken", checkToken, token);
            return false;
        }
        if (!ws.fd) {
            return false;
        }
        var fd = ws.fd;
        if (manage.CHAT_ACTION_CASE[action]) {
            await this[manage.CHAT_ACTION_CASE[action]](fd, ...args);
        } else if (manage.ROOM_ACTION_CASE[action]) {
            await this.execRoom(fd, manage.ROOM_ACTION_CASE[action], args);
        } else {
            debug(`${action}: error_action`);
        }
    }

    async execRoom(fd, cmd, args) {
        var player = await manage.getPlayerByFd(fd);
        if (!player) {
            return manage.send(fd, proto.error("user_not_login"));
        }
        var name = "room-" + args[0];
        var lock = await locker.lock(name);
        if (!lock) {
            return manage.send(fd, proto.error(name + "-locked"));;
        }
        await roomHandler[cmd](player, ...args);
        await lock.unlock(name);
    }


    /**
     * 登陆服务器
     * @param  {[type]} fd
     * @param  {[type]} uid
     * @param  {[type]} sid
     * @return {Promise}
     */
    async login(fd, uid, sid) {
        // 同一个会话只能绑定同一个UID
        var tarUid = manage.getUid(fd);
        if (tarUid && tarUid != uid) {
            return manage.send(fd, proto.error("user_not_same"));
        }

        // 获取玩家信息
        var userInfo = await dbModel.getUserInfo(uid);
        if (wee.empty(userInfo)) {
            if (!config.debug) {
                return manage.send(fd, proto.error("user_not_login"));
            } else {
                userInfo = {
                    "uid": uid,
                    "sid": "#test-sid#",
                    "baseInfo": { "name": `test-${uid}`, "level": 1 },
                    "cateId": ["world-s1"]
                };
            }
        }
        // 验证sid
        if (!sid || userInfo.sid != sid) {
            if (!config.debug) {
                return manage.send(fd, proto.error("user_not_login"));
            }
        }



        // 用户已登陆
        var oldPlayer = await manage.getPlayer(uid);
        if (oldPlayer) {
            // 在其它地方登陆
            if (oldPlayer.fd != fd) {
                await this.remote.emit("otherLogin", uid, oldPlayer.fd);
            }
            // 退出频道
            for (let cateId of oldPlayer.cateId) {
                await manage.delCate(cateId, uid);
            }
        }

        // 生成玩家对象
        var player = Object.assign({
            fd: fd,
            nsp: this.remote.channel
        }, userInfo);

        // 注册玩家事件
        manage.bindUidFd(uid, fd);
        var queue = [];
        queue.push(manage.setPlayer(uid, player));
        queue.push(manage.setOnline(uid));

        // 加入频道
        for (let cateId of player.cateId) {
            queue.push(manage.setCate(cateId, uid));
        }

        // 获取房间信息
        var otherInfo = null;
        var tarRoomId = await manage.getPlayerRoom(uid);
        if (tarRoomId) {
            var roomInfo = await manage.getRoomInfo(tarRoomId);
            if (roomInfo) {
                otherInfo = {
                    roomId: roomInfo.roomId,
                    type: roomInfo.type,
                    typeId: roomInfo.typeId,
                    isStart: roomInfo.isStart
                }
            } else {
                queue.push(manage.delPlayerRoom(tarRoomId));
            }
        }
        await Promise.all(queue);

        // 登陆成功
        var msg = proto.login(uid, player.baseInfo, otherInfo);
        manage.send(fd, msg);
    };




    /**
     * 退出登陆
     * @param {any} fd
     */
    async logout(fd) {
        var uid = manage.getUid(fd);
        if (uid) {
            manage.clearPlayer(uid);
            manage.clearUidFd(uid, fd);
        }
    }

    /**
     * 心跳
     * @param  {[type]} fd
     * @param  {[type]} id
     * @param  {[type]} ctime
     * @return {Promise}
     */
    async heartbeat(fd, id, ctime) {
        var msg = proto.heartbeat(id, Date.now());
        manage.send(fd, msg);
    }


    /**
     * 发送私聊消息
     * @param  {[type]} fd
     * @param  {[type]} tarUid
     * @param  {[type]} data
     * @return {Promise}
     */
    async pm(fd, tarUid, data) {
        var player = await manage.getPlayerByFd(fd);
        if (!player) {
            return manage.send(fd, proto.error("user_not_login"));
        }
        // 判断目标是否在线
        var tarPlayer = await manage.getPlayer(tarUid);
        if (!tarPlayer || tarPlayer.fd == 0) {
            return manage.send(fd, proto.error('user_offline'));
        }
        var msg = proto.pm(player.uid, player.baseInfo, data);
        this.sendUid(tarUid, msg);

    }


    /**
     * 发送频道消息
     * @param  {[type]} fd
     * @param  {[type]} cateId
     * @param  {[type]} data
     * @return {Promise}
     */
    async cateMsg(fd, cateId, data) {
        var player = await manage.getPlayerByFd(fd);
        if (!player) {
            return manage.send(fd, proto.error("user_not_login"));
        }
        if (!player.cateId.includes(cateId)) {
            return manage.send(fd, proto.error("cate_not_join"));
        }
        var msg = proto.cateMsg(cateId, player.uid, player.baseInfo, data);
        var cateList = await manage.getCate(cateId);
        for (let tarUid of cateList) {
            this.sendUid(parseInt(tarUid), msg);
        }
    }

    /**
     * 世界频道消息
     * @param  {[type]} fd
     * @param  {[type]} data
     * @return {Promise}
     */
    async worldMsg(fd, data) {
        var player = await manage.getPlayerByFd(fd);
        if (!player) {
            return manage.send(fd, proto.error("user_not_login"));
        }
        var msg = proto.worldMsg(player.uid, player.baseInfo, data);
        await this.remote.emit("sendAll", msg);
    }

    async sendUid(uid, msg) {
        await this.remote.emit("sendUid", uid, msg);
    }

}

const handler = new Handler();

module.exports = handler;
