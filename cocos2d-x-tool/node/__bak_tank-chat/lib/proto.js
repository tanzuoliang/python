/**
 * @Author: wbsifan
 * @Date:   2017-01-12T17:36:55+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 20-Sep-2017
 */



/**
 * Created by wbsifan on 2016/12/29.
 */
var proto = {

    // 错误消息
    error(msg, ...args) {
        return [-1, [msg, ...args]];
    },

    // 登陆成功
    // userInfo: 玩家名子等基本信息
    // roomInfo: roomId, battleId等
    login(uid, userInfo, roomInfo) {
        return [1, [uid, userInfo, roomInfo]];
    },

    heartbeat(id, time) {
        return [3, [id, time]];
    },

    // 私聊
    pm(uid, userInfo, msg) {
        return [10, [uid, userInfo, msg]];
    },
    // 频道消息
    cateMsg(cateId, uid, userInfo, msg) {
        return [20, [cateId, uid, userInfo, msg]];
    },
    // 世界消息
    worldMsg(uid, userInfo, msg) {
        return [21, [uid, userInfo, msg]];
    },

    // 通知消息
    notice(data) {
        return [101, data];
    },

    // 加入房间成功
    roomEnter(roomId, roomInfo) {
        return [30, [roomId, roomInfo]];
    },
    // 加入房间
    // state  [队伍(1, 2), 位置, 出战坦克, 道具, 是否已准备]
    roomJoin(roomId, uid, userInfo, state) {
        return [31, [roomId, uid, userInfo, state]];
    },
    // 退出房间
    roomOut(roomId, uid) {
        return [32, [roomId, uid]];
    },
    // 房间消息
    roomMsg(roomId, uid, msg) {
        return [33, [roomId, uid, msg]];
    },
    // 房间状态切换
    // state  [队伍(1, 2), 位置, 出战坦克, 道具, 是否已准备]
    roomState(roomId, uid, state) {
        return [34, [roomId, uid, state]];
    },
    // 邀请 : 增加 camp(1, 2) 阵营
    invite(roomId, uid, userInfo, roomKey, roomInfo, camp) {
        return [35, [roomId, uid, userInfo, roomKey, roomInfo, camp]];
    },
    // 踢出游戏
    tick(roomId) {
        return [36, [roomId]];
    },
    // 房间公共信息改变
    roomInfo(roomId, roomInfo) {
        return [37, [roomId, roomInfo]];
    },
    // 开始游戏
    start(roomId, battleServerInfo, roomInfo) {
        return [38, [roomId, battleServerInfo, roomInfo]];
    },
    // 房间解散
    dismiss(roomId) {
        return [39, [roomId]];
    },
    // 开始匹配
    match(roomId, waitTime = 30) {
        return [40, [roomId, waitTime]];
    },
    // 取消匹配
    cancel(roomId) {
        return [41, [roomId]];
    }
}

module.exports = proto;
