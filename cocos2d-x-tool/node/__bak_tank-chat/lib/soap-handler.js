/**
 * @Author: wbsifan
 * @Date:   2017-04-12T20:23:50+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 20-Sep-2017
 */

"use strict";
// 加载配置文件
const config = require("./config");
const manage = require("./manage");
const proto = require("./proto");
const debug = require("debug")("wee:soap-handler");
const roomHandler = require("./room-handler");
const chatHandler = require("./chat-handler");


class Handler {
    constructor() {}

    /**
     * 发送消息通知
     * @param  {[type]} tarUid  目标UID
     * @param  {[type]} data    要广播的内容
     * @return {Promise}
     */
    async notice(ctx, tarUid, data) {
        // 判断目标是否在线
        var tarPlayer = await manage.getPlayer(tarUid);
        if (!tarPlayer || tarPlayer.fd == 0) {
            return ctx.set("ret", 0);
        }
        var msg = proto.notice(data);
        chatHandler.sendUid(tarUid, msg);
        return ctx.set("ret", 1);
    }

    async onlineCount(ctx) {
        var count = await manage.getOnlineCount();
        return ctx.set("count", count);
    }

    async onlineList(ctx, num = 10) {
        var list = await manage.getOnlineList(num);
        console.log(list);
        return ctx.set(list);
    }

    /**
     * 获取玩家状态
     * @param  {[type]} uidList
     * @return {Promise}
     */
    async playerState(ctx, ...uidList) {
        var state = {};
        for (let uid of uidList) {
            state[uid] = (await manage.getPlayerState(uid))["value"];
        }
        return ctx.set(state);
    }


    /**
     * 创建房间
     * @param  {[type]} roomInfo
     * @return {Promise}
     */
    async createRoom(ctx, roomInfo) {
        var ownerUid = roomInfo.ownerUid;

        var tarRoomId = await manage.getPlayerRoom(ownerUid);
        if (tarRoomId) {
            var tarRoomInfo = await manage.getRoomInfo(tarRoomId);
            if (tarRoomInfo) {
                var expire = await manage.getRoomExpire(tarRoomId);
                ctx.set("expire", expire);
                if (tarRoomInfo.isStart) {
                    return ctx.setError("room_is_battle");
                } else {
                    return ctx.setError("room_is_join");
                }
            } else {
                await manage.delPlayerRoom(ownerUid);
            }
        }

        var roomId = await manage.makeRoomId();
        await roomHandler.create(roomId, roomInfo);
        return ctx.set("roomId", roomId);
    }

    /**
     * 结束房间
     * @param  {[type]} ctx
     * @param  {[type]} roomId
     * @return {Promise}
     */
    async roomOver(ctx, roomId, record) {
        await roomHandler.over(roomId, record);
    }
}

const handler = new Handler();
module.exports = handler;
