/**
 * @Author: wbsifan
 * @Date:   13-Oct-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 19-Oct-2017
 */

// 加载核心框架
const config = require("weejs/config").create();
const wee = require("weejs");
var Table = require('cli-table2');

// 配置文件标识
const NODE_ENV = process.env.NODE_ENV || "dev";

// 更新服务器配置
const servOpt = require(`../tank-conf/${NODE_ENV}.js`);

config.set(servOpt);

console.log("================Start=================");
console.log(config);
console.log("================|||||=================");

const redis = new require("ioredis")(config.redisConfig);


async function main() {
    const table1 = new Table({
        head: ["id", "uid", "online", "tarRoomId", "recRoomId", "ttl"]
    });
    const table2 = new Table({
        head: ["id", "uid", "online", "tarRoomId", "recRoomId", "ttl"]
    });
    var playerRoomList = await redis.hgetall("player-room");
    var roomKeys = await redis.keys("room-info:*");
    var idx1 = 0;
    var idx2 = 0;
    for (let k of roomKeys) {
        let roomStr = await redis.get(k);
        if (!roomStr) {
            continue;
        }
        let roomInfo = wee.jsonDecode(roomStr);
        let uid = roomInfo.ownerUid;
        if (!uid) {
            continue;
        }
        let tarRoomId = playerRoomList[uid];
        let online = await redis.sismember("player-online", uid);
        online = online ? "在线" : "--";
        let ttl = await redis.ttl(k);
        if (ttl < 0) {
            if (tarRoomId == roomInfo.roomId) {
                idx1++;
                table1.push([idx1, uid, online, tarRoomId, roomInfo.roomId, ttl]);
            } else {
                idx2++;

                // console.log("del:", `room-info:${roomInfo.roomId}`, `room-info:${roomInfo.roomId}`);
                // redis.del(`room-info:${roomInfo.roomId}`);
                // redis.del(`room-team:${roomInfo.roomId}`);
                table2.push([idx2, uid, online, tarRoomId, roomInfo.roomId, ttl]);
            }
        }

    }
    console.log("/n/n/n/n/n/n");
    console.log(table1.toString());
    console.log("/n/n/n/n/n/n");
    console.log(table2.toString());
}

var by = function(name) {
    return function(o, p) {
        var a, b;
        if (typeof o === "object" && typeof p === "object" && o && p) {
            a = parseInt(o[name]);
            b = parseInt(p[name]);
            if (a === b) {
                return 0;
            }
            if (typeof a === typeof b) {
                return a < b ? -1 : 1;
            }
            return typeof a < typeof b ? -1 : 1;
        } else {
            throw ("error");
        }
    }
}

main();
setInterval(() => {
    //main()
}, 5000)
