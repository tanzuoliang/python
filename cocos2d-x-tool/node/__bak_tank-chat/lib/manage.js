/**
 * @Author: wbsifan
 * @Date:   2017-03-07T16:02:08+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 22-Sep-2017
 */
"use strict";
// 加载配置文件
const config = require("./config");
const wee = require("weejs");
const RedisClient = require("ioredis");
const util = require("util");
const ip = require("ip");
const debug = require("debug")("wee:manage");



const CONN_LIST_RKEY = "chat-conn";
const CHAT_PLAYER_RKEY = "chat-player";
const CHAT_CATE_RKEY = "chat-cate";
const ROOM_PLAYER_RKEY = "room-player";


class Manage {
    constructor() {
        // 聊天进程名
        this.REMOTE_CHAT_NSP = "/tank-chat";
        // 匹配进程名
        this.REMOTE_MATCH_NSP = "/tank-match";
        // 房间进程名
        this.REMOTE_ROOM_NSP = "/tank-room";
        // 空房等待时间
        this.EMPTY_EXPIRE_TIME = 60;
        // 游戏开始时间
        this.START_EXPIRE_TIME = 300;
        // 匹配进程更新间隔
        this.MATCH_UPDATE_TIME = 1000;
        // 最大匹配等待时间
        this.MATCH_WAIT_TIME = 20000;
        // 最大自增ID值
        this.MAX_INCR_ID = 16000000;



        this.MIN_PLAYER_NUM = 3;

        /**
         * 聊天上行协议标识
         * @type {Object}
         */
        this.CHAT_ACTION_CASE = {
            1: "login",
            2: "logout",
            3: "heartbeat",
            10: "pm",
            20: "cateMsg",
            21: "worldMsg"
        };

        /**
         * 房间管理上行协议标识
         * @type {Object}
         */
        this.ROOM_ACTION_CASE = {
            31: "join",
            32: "out",
            33: "msg",
            34: "state",
            35: "invite",
            36: "tick",
            37: "info",
            38: "start",
            40: "match",
            41: "cancel"
        };

        /**
         * 地图类型
         * @type {Number}
         */
        this.TYPE_MAP_EDIT = 1; //编辑地图试玩
        this.TYPE_NORMAL = 2; //经典模式,官方副本
        this.TYPE_CHALLENGE = 3; //挑战模式
        this.TYPE_MAP = 4; //玩家地图无奖励(最新最热等)
        this.TYPE_FRIENDSHIP = 5; //PVP友谊赛官方地图
        this.TYPE_COMPETE = 6; //PVP天梯赛
        this.TYPE_SELF_UPLOAD = 7; //自己上传的地图
        this.TYPE_MATCHING = 8; // 匹配赛
        // 匹配赛每边玩家数量
        this.MIN_PLAYER_NUM = 2;
        // PVE模式列表
        this.TYPE_PVE_MODE = [
            this.TYPE_MAP_EDIT,
            this.TYPE_NORMAL,
            this.TYPE_CHALLENGE,
            this.TYPE_MAP,
            this.TYPE_SELF_UPLOAD,
            this.TYPE_MATCHING
        ];
        // 可以更换信息的模式
        this.TYPE_CUSTOM_MODE = [
            this.TYPE_FRIENDSHIP,
            this.TYPE_MATCHING
        ];
        // 匹配模式列表
        this.TYPE_MATCH_MODE = [this.TYPE_COMPETE];

        /**
         * 变量
         * @type {Number}
         */
        this.startFd = 0;
        // fd ==> ws
        this.fdSocketList = new Map();
        // fd ==> uid
        this.fdUidList = new Map();
        // uid ==> fd
        this.uidFdList = new Map();
        // uid ==> player
        this.playerList = new Map();

        this.redis = new RedisClient(config.redisConfig);
        this.subRedis = new RedisClient(config.redisConfig);
        this.pubRedis = new RedisClient(config.redisConfig);

        // 监听进程退出
        wee.onExit(async(done) => {
            debug("process onExit:", process.pid);
            var queue = [];
            // 删除玩家信息
            for (let [fd, uid] of this.fdUidList) {
                // 删除玩家信息
                queue.push(this.clearPlayer(uid));
                // 删除Fd会话信息
                queue.push(this.clearUidFd(uid, fd));
            }
            await Promise.all(queue);
            done();
        });
    }

    /**
     * 生成连接Fd
     * @return {[type]}
     */
    makeFd() {
        this.startFd++;
        if (this.startFd > this.MAX_INCR_ID) {
            this.startFd = 1;
        }
        return [ip.address(), process.pid, ++this.startFd].join("/");
    }

    //*============ Clear Manage =============*//

    /**
     * 清除玩家所有数据
     * @param  {[type]} uid
     * @param  {[type]} [player=null]
     * @return {Promise}
     */
    async clearPlayer(uid) {
        var queue = [];
        var player = await this.getPlayer(uid);
        if (!player) {
            return false;
        }

        // 退出频道
        if (player.cateId) {
            for (let cateId of player.cateId) {
                queue.push(this.delCate(cateId, uid));
            }
        }

        // 退出房间
        var tarRoomId = await this.getPlayerRoom(uid);
        if (tarRoomId) {
            var roomHandler = require("./room-handler");
            queue.push(roomHandler.offline(player, tarRoomId));
        }

        // 删除玩家信息
        queue.push(this.delPlayer(uid));
        queue.push(this.delOnline(uid));
        await Promise.all(queue);
    }




    //*============ Send Manage =============*//
    send(fd, msg) {
        var ws = this.fdSocketList.get(fd);
        if (!ws) {
            return debug("send to FD = ", fd, "not exists");
        }
        if (!wee.isString(msg)) {
            msg = JSON.stringify(msg);
        }
        debug("localSeand: FD = ", ws.fd, msg);
        try {
            ws.send(msg);
        } catch (err) {
            wee.error(err);
        }
    }





    //*============ Room Manage =============*//

    async getBattleServerList() {
        var rkey = "tank-battle";
        var ret = await this.redis.hgetall(rkey);
        if (!wee.empty(ret)) {
            var list = [];
            for (let k in ret) {
                list.push(wee.jsonDecode(ret[k]));
            }
            return list;
        }
        return null;
    }

    async getBattleServer() {
        var list = await this.getBattleServerList();
        if (list) {
            return wee.arrayRand(list);
        } else {
            return null;
        }
    }

    /**
     * 生成房间ID
     * @return {Promise}
     */
    async makeRoomId() {
        var rkey = "room-id";
        var ret = await this.redis.incr(rkey);
        return ret;
    }

    /**
     * 获取不同类型房间的ID
     * @param  {[type]} type
     * @return {Promise}
     */
    async makeMatchRoomId() {
        var rkey = "match-room-id";
        var ret = await this.redis.incr(rkey);
        return ret;
    }





    async getRoomExpire(roomId) {
        var rkey = `room-info:${roomId}`;
        var ret = await this.redis.ttl(rkey);
        return ret;
    }

    async setRoomExpire(roomId, ttl = 60) {
        await Promise.all([
             this.redis.expire(`room-info:${roomId}`, ttl),
             this.redis.expire(`room-team:${roomId}`, ttl)
        ]);
    }

    async clearRoomExpire(roomId) {
        await Promise.all([
            this.redis.persist(`room-info:${roomId}`),
            this.redis.persist(`room-team:${roomId}`)
        ]);
    }

    async getRoomInfo(roomId) {
        var rkey = `room-info:${roomId}`;
        var ret = await this.redis.get(rkey);
        if (ret) {
            ret = wee.jsonDecode(ret);
        }
        return ret;
    }

    async setRoomInfo(roomId, roomInfo) {
        var rkey = `room-info:${roomId}`;
        await this.redis.set(rkey, wee.jsonEncode(roomInfo));
        //await this.redis.hmset(rkey, roomInfo);
    }


    async delRoomInfo(roomId) {
        var rkey = `room-info:${roomId}`;
        await this.redis.del(rkey);
    }

    async getRoomUidList(roomId) {
        var rkey = `room-team:${roomId}`;
        var ret = await this.redis.hkeys(rkey);
        return ret;
    }

    async getRoomTeam(roomId, uid = null) {
        var rkey = `room-team:${roomId}`;
        if (uid) {
            var ret = await this.redis.hget(rkey, uid);
            if (ret) {
                ret = wee.jsonDecode(ret);
            }
            return ret;
        } else {
            var retList = await this.redis.hgetall(rkey);
            var ret = {};
            for (let uid in retList) {
                ret[uid] = wee.jsonDecode(retList[uid]);
            }
            return ret;
        }
    }


    async setRoomTeam(roomId, uid, player) {
        var rkey = `room-team:${roomId}`;
        if (wee.isObject(uid)) {
            var list = {};
            for (let k in uid) {
                list[k] = wee.jsonEncode(uid[k]);
            }
            await this.redis.hmset(rkey, list);
        } else {
            await this.redis.hset(rkey, uid, wee.jsonEncode(player));
        }
    }

    async delRoomTeam(roomId, uid = null) {
        var rkey = `room-team:${roomId}`;
        if (uid) {
            await this.redis.hdel(rkey, uid);
        } else {
            await this.redis.del(rkey);
        }
    }

    /**
     * 获取玩家加入的房间ID
     * @param  {[type]} uid
     * @return {Promise}
     */
    async getPlayerRoom(uid) {
        var rkey = `player-room`;
        var ret = await this.redis.hget(rkey, uid);
        return ret;
    }

    /**
     * 更新玩家加入的房间ID
     * @param  {[type]} uid
     * @param  {[type]} roomId
     * @return {Promise}
     */
    async setPlayerRoom(uid, roomId) {
        var rkey = `player-room`;
        await this.redis.hset(rkey, uid, roomId);
    }

    /**
     * 删除玩家
     * @param  {[type]} uid
     * @return {Promise}
     */
    async delPlayerRoom(uid) {
        var rkey = `player-room`;
        await this.redis.hdel(rkey, uid);
    }


    //*============ Cate Manage =============*//
    /**
     * 获取频道列表
     * @param  {[type]} cateId
     * @return {Promise}
     */
    async getCate(cateId) {
        var rkey = `cate:${cateId}`;
        var res = await this.redis.smembers(rkey);
        return res;
    }

    /**
     * 加入频道
     * @param  {[type]} cateId
     * @param  {[type]} player
     * @return {[type]}
     */
    async setCate(cateId, uid) {
        var rkey = `cate:${cateId}`;
        this.redis.sadd(rkey, uid);
    }

    /**
     * 退出频道
     * @param  {[type]} cateId
     * @param  {[type]} uid
     * @return {[type]}
     */
    async delCate(cateId, uid) {
        var rkey = `cate:${cateId}`;
        this.redis.srem(rkey, uid);
    }

    //*============ Player Manage =============*//
    async getPlayerState(uid) {
        var [player, roomId] = await Promise.all([this.getPlayer(uid), this.getPlayerRoom(uid)]);
        var state = {
            value: 0,
            online: 0,
            roomId: 0
        };
        if (player) {
            state.value = 2;
            state.online = 1;
        }
        if (roomId) {
            state.value = 1;
            state.roomId = roomId;
        }
        return state;
    }

    /**
     * 根据FD获取玩家
     * @param  {[type]} fd
     * @return {Promise}
     */
    async getPlayerByFd(fd) {
        var uid = await this.getUid(fd);
        if (uid) {
            var ret = await this.getPlayer(uid);
            return ret;
        }
        return null;
    }


    /**
     * 根据UID获取玩家
     * @param  {[type]} uid
     * @return {Promise}
     */
    async getPlayer(uid) {
        if (this.playerList.has(uid)) {
            return this.playerList.get(uid);
        }
        var rkey = `player-info:${uid}`;
        var ret = await this.redis.get(rkey);
        if (ret) {
            ret = wee.jsonDecode(ret);
        }
        return ret;
    }

    /**
     * 更新玩家数据
     * @param  {[type]} uid
     * @param  {[type]} player
     * @return {Promise}
     */
    async setPlayer(uid, player) {
        this.playerList.set(uid, player);
        var rkey = `player-info:${uid}`;
        await this.redis.set(rkey, wee.jsonEncode(player));
    }

    /**
     * 删除玩家数据
     * @param  {[type]} uid
     * @return {Promise}
     */
    async delPlayer(uid) {
        this.playerList.delete(uid);
        var rkey = `player-info:${uid}`;
        await this.redis.del(rkey);
    }

    /**
     * 获取在线玩家数量
     * @return {Promise}
     */
    async getOnlineCount() {
        var rkey = "player-online";
        var ret = await this.redis.scard(rkey);
        return ret;
    }

    /**
     * 获取在线的玩家集合
     * @param  {Number} [num=10]
     * @return {Promise}
     */
    async getOnlineList(num = 10) {
        var rkey = "player-online";
        if (num == 0) {
            var ret = await this.redis.smembers(rkey);
        } else {
            var ret = await this.redis.srandmember(rkey, num);
        }
        return ret;
    }

    /**
     * 添加在线玩家
     * @param  {[type]} uid
     * @return {Promise}
     */
    async setOnline(uid) {
        var rkey = "player-online";
        await this.redis.sadd(rkey, uid);
    }

    /**
     * 删除在线玩家
     * @param  {[type]} uid
     * @return {Promise}
     */
    async delOnline(uid) {
        var rkey = "player-online";
        await this.redis.srem(rkey, uid);
    }


    /**
     * 绑定UID==>FD
     * @param  {[type]} uid
     * @param  {[type]} fd
     * @return {Promise}
     */
    bindUidFd(uid, fd) {
        uid = parseInt(uid);
        this.fdUidList.set(fd, uid);
        this.uidFdList.set(uid, fd);
    }

    /**
     * 删除UID==>FD绑定
     * @param  {[type]} uid
     * @param  {[type]} fd
     * @return {Promise}
     */
    clearUidFd(uid, fd) {
        uid = parseInt(uid);
        this.fdUidList.delete(fd);
        this.uidFdList.delete(uid);
    }

    /**
     * 根据FD获取UID
     * @param  {[type]} fd
     * @return {Promise}
     */
    getUid(fd) {
        return this.fdUidList.get(fd);
    }

    /**
     * 根据UID获取FD
     * @param  {[type]} uid
     * @return {Promise}
     */
    getFd(uid) {
        uid = parseInt(uid);
        return this.uidFdList.get(uid);
    }

}


const manage = new Manage();

module.exports = manage;
