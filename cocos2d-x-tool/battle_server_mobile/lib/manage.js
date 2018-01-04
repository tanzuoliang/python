/**
 * @Author: wbsifan
 * @Date:   2017-05-26T16:00:21+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 17-Oct-2017
 */
const config = require("./config");
const RedisClient = require("ioredis");
const Remote = require("weejs/remote");


class Manage {
    constructor() {
        this.address = config.publicAddress;
        this.port = 41234;
        if (process.env.NODE_APPID) {
            this.port += parseInt(process.env.NODE_APPID);
        }
        console.log("start battle server at port:", this.port);
        this.redis = new RedisClient(config.redisConfig);
        this.nsp = `/tank-battle`;
        this.startCb = null;
        this.remote = Remote.create(config.redisConfig, this.nsp);
        this.channel = this.remote.channel;
        this.remote.on("start", (battleInfo) => {
            if (this.startCb) {
                this.startCb(battleInfo);
            }
        });
        this.register();
        wee.onExit(async(done) => {
            await this.clear();
            done();
        });
    }

    onStart(cb) {
        this.startCb = cb;
    }

    async register() {
        var rkey = "tank-battle";
        await this.redis.hset(rkey, this.channel, wee.jsonEncode({
            nsp: this.channel,
            address: this.address,
            port: this.port
        }));
    }

    async clear() {
        var queue = [];
        var rkey = "tank-battle";
        queue.push(this.redis.hdel(rkey, this.channel));
        var roomMap = require("../room").RoomManager.roomMap;
        for (let [roomId, roomObj] of roomMap) {
            queue.push(this.delRoomInfo(roomId));
            queue.push(this.delRoomTeam(roomId));
        }
        await Promise.all(queue);
    }


    async delRoomInfo(roomId) {
        var rkey = `room-info:${roomId}`;
        await this.redis.del(rkey);
    }


    async delRoomTeam(roomId) {
        var rkey = `room-team:${roomId}`;
        await this.redis.del(rkey);
    }
}

module.exports = new Manage();
