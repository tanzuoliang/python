/**
 * @Author: wbsifan
 * @Date:   12-Oct-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 19-Oct-2017
 */


/**
 * @Author: wbsifan
 * @Date:   2017-05-15T11:08:39+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 19-Oct-2017
 */
// 加载配置文件
const config = require("./config");
const debug = require("debug")("wee:room-index");
const Remote = require("weejs/remote");
const manage = require("./manage");
const proto = require("./proto");
const dbModel = require("./db-model");
const locker = require("weejs/locker").create(manage.redis);

class RoomManage {
    constructor() {
        this.remote = Remote.create({
            subRedis: manage.subRedis,
            pubRedis: manage.pubRedis
        }, manage.REMOTE_ROOM_NSP);
        this.remote.on("action", async(player, cmd, args) => {
            var name = "room-" + args[0];
            var lock = await locker.lock(name);
            if (!lock) {
                return this.send(player.uid, proto.error(name + "-locked"));
            }
            await this[cmd](player, ...args);
            await lock.unlock(name);
        });

        this.remote.on("offline", async(player, roomId) => {
            this.offline(player, roomId);
        });

        // 监听进程退出
        wee.onExit(async(done) => {
            debug("process onRoomExit:", process.pid);
            // var queue = [];
            // queue.push(manage.clearRoomInfo());
            // queue.push(manage.clearRoomTeam());
            // queue.push(manage.clearPlayerRoom());
            // await Promise.all(queue);
            done();
        });
    }

    /**
     * 创建房间
     * @param  {[type]} roomId
     * @param  {[type]} roomInfo
     * @return {Promise}
     */
    async create(roomId, roomInfo) {
        var roomInfo = Object.assign(roomInfo, {
            type: parseInt(roomInfo.type),
            typeId: parseInt(roomInfo.typeId),
            roomId: roomId,
            isStart: 0,
            isMatch: 0
        });
        await Promise.all([
             manage.setRoomInfo(roomId, roomInfo),
             manage.setRoomExpire(roomId, manage.EMPTY_EXPIRE_TIME)
         ]);
    }


    /**
     * 加入房间
     * @param  {[type]} player
     * @param  {[type]} roomId
     * @param  {[type]} roomKey
     * @param  {[type]} camp
     * @return {Promise}
     */
    async join(player, roomId, roomKey, camp) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.error("room_not_create"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (roomInfo.isMatch) {
            return this.send(player.uid, proto.error("room_is_match"));
        }
        // 在其它房间中
        var tarRoomId = await manage.getPlayerRoom(player.uid);
        if (tarRoomId) {
            return this.send(player.uid, proto.error("room_is_join"));
        }
        // 不是房主且密码不正确
        if (player.uid != roomInfo.ownerUid && roomKey != roomInfo.key) {
            return this.send(player.uid, proto.error("room_not_invite"));
        }

        // 获取用户战斗状态
        var roomState = await dbModel.getRoomState(roomInfo.type, player.uid);
        if (!roomState) {
            return this.send(player.uid, proto.error("room_state_error"));
        }

        // 初始化玩家对象
        var roomPlayer = Object.assign({}, roomState, {
            uid: player.uid,
            roomId: roomId,
            camp: camp,
            pos: 0,
            ready: 0
        });

        console.log("roomPlayer info:" + JSON.stringify(roomPlayer));

        // 初始化队伍位置信息
        var teamPos = { 1: [], 2: [] };
        for (let i = 0; i < roomInfo.teamNum1; i++) {
            teamPos[1][i] = 0;
        }
        for (let i = 0; i < roomInfo.teamNum1; i++) {
            teamPos[2][i] = 0;
        }

        // 获取队伍列表
        var teamList = await manage.getRoomTeam(roomId);
        for (let uid in teamList) {
            let tmp = teamList[uid];
            teamPos[tmp.camp][tmp.pos] = uid;
        }
        // 判断是否可加入
        var canJoin = false;
        for (let [k, v] of teamPos[camp].entries()) {
            // 该位置空缺 占用当前位置
            if (v == 0) {
                roomPlayer.pos = k;
                canJoin = true;
                break;
            }
        }
        // 位置已满
        if (!canJoin) {
            return this.send(player.uid, proto.error("room_max_num"));
        }

        // 加入房间成功
        await Promise.all([
             manage.setPlayerRoom(player.uid, roomId),
             manage.setRoomTeam(roomId, player.uid, roomPlayer),
             manage.clearRoomExpire(roomId)
         ]);

        // 发送加入成功消息
        var msg = proto.roomEnter(roomId, this._getBaseInfo(roomInfo));
        this.send(player.uid, msg);

        // 发送已加入的玩家信息
        for (let uid in teamList) {
            let tarPlayer = teamList[uid];
            let msg = proto.roomJoin(roomId, tarPlayer.uid, tarPlayer.baseInfo, this._roomState(tarPlayer));
            this.send(player.uid, msg);
            console.log("1:发送已加入的玩家信息:" + msg);

        }

        // 通知其它玩家加入成功
        var msg = proto.roomJoin(roomId, player.uid, player.baseInfo, this._roomState(roomPlayer));
        this.sendAll(roomId, msg);
        console.log("2:发送已加入的玩家信息:" + msg);
    }

    /**
     * 玩家断线
     * @param  {[type]} player
     * @param  {[type]} roomId
     * @return {Promise}
     */
    async offline(player, roomId) {
        console.log("room-offline:", "roomId=", roomId, "uid=", player.uid);
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            await manage.delPlayerRoom(player.uid);
            return false;
        }
        // 获取队伍信息
        var roomPlayer = await manage.getRoomTeam(roomId, player.uid);
        if (!roomPlayer) {
            await manage.delPlayerRoom(player.uid);
            return false;
        }
        if (roomInfo.isStart) {
            return false;
        }
        if (roomInfo.isMatch) {
            return false;
        }
        // 房主 解散房间
        if (player.uid == roomInfo.ownerUid) {
            // 解散房间
            var msg = proto.dismiss(roomId);
            this.sendAll(roomId, msg);
            await Promise.all([
                 this._clearRoom(roomId)
             ]);
        } else {
            // 从玩家列表删除
            await Promise.all([
                 manage.delPlayerRoom(player.uid),
                 manage.delRoomTeam(roomId, player.uid)
             ]);

            // 退出房间
            var msg = proto.roomOut(roomId, player.uid);
            this.sendAll(roomId, msg);
        }
    }

    /**
     * 退出房间
     * @param  {[type]} player
     * @param  {[type]} roomId
     * @return {Promise}
     */
    async out(player, roomId) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            await manage.delPlayerRoom(player.uid);
            return false;
        }
        // 获取队伍信息
        var roomPlayer = await manage.getRoomTeam(roomId, player.uid);
        if (!roomPlayer) {
            await manage.delPlayerRoom(player.uid);
            return false;
        }

        // 战斗已开始 不允许退出
        if (roomInfo.isStart) {
            // PVE模式 可以退出
            if (manage.TYPE_PVE_MODE.includes(roomInfo.type)) {
                await Promise.all([
                     manage.delPlayerRoom(player.uid),
                     manage.delRoomTeam(roomId, player.uid)
                 ]);
            }
            return false;
        }
        if (roomInfo.isMatch) {
            return false;
        }
        // 房主 解散房间
        if (player.uid == roomInfo.ownerUid) {
            // 解散房间
            var msg = proto.dismiss(roomId);
            this.sendAll(roomId, msg);
            await Promise.all([
                this._clearRoom(roomId)
            ]);
        } else {
            // 从玩家列表删除
            await Promise.all([
                 manage.delPlayerRoom(player.uid),
                 manage.delRoomTeam(roomId, player.uid)
             ]);

            // 退出房间
            var msg = proto.roomOut(roomId, player.uid);
            this.sendAll(roomId, msg);
        }
    }

    /**
     * 更改地图信息
     * @param  {[type]} player
     * @param  {[type]} type
     * @param  {[type]} info
     * @return {Promise}
     */
    async info(player, roomId, type, info) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.error("room_not_create"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (roomInfo.isMatch) {
            return this.send(player.uid, proto.error("room_is_match"));
        }
        // 不是房主
        if (roomInfo.ownerUid != player.uid) {
            return this.send(player.uid, proto.error("room_not_owner"));
        }
        // 不在房间中
        var roomPlayer = await manage.getRoomTeam(roomId, player.uid);
        if (!roomPlayer) {
            return this.send(player.uid, proto.error("room_not_join"));
        }

        // 自定义模式
        if (manage.TYPE_CUSTOM_MODE.includes(roomInfo.type)) {
            if (type == 1) {
                roomInfo.typeId = info;
                await Promise.all([
                     manage.setRoomInfo(roomId, roomInfo)
                 ]);
            }
        } else {
            return this.send(player.uid, proto.error("room_error_state"));
        }

        var msg = proto.roomInfo(roomId, this._getBaseInfo(roomInfo));
        this.sendAll(roomId, msg);
    }

    /**
     * 房间消息
     * @param  {[type]} player
     * @param  {[type]} roomId
     * @param  {[type]} msg
     * @return {Promise}
     */
    async msg(player, roomId, msg) {
        var roomPlayer = await manage.getRoomTeam(roomId, player.uid);
        if (!roomPlayer) {
            return this.send(player.uid, proto.error("room_not_join"));
        }
        var msg = proto.roomMsg(roomId, player.uid, msg);
        this.sendAll(roomId, msg);
    }

    /**
     * 房间状态切换
     * @param  {[type]} player
     * @param  {[type]} type
     * @param  {[type]} state
     * @return {Promise}
     */
    async state(player, roomId, type, state) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.error("room_not_create"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (roomInfo.isMatch) {
            return this.send(player.uid, proto.error("room_is_match"));
        }
        // 不在房间中
        var roomPlayer = await manage.getRoomTeam(roomId, player.uid);
        if (!roomPlayer) {
            return this.send(player.uid, proto.error("room_not_join"));
        }
        // 已准备
        if (roomPlayer.ready == 1) {
            return this.send(player.uid, proto.error("room_is_ready"));
        }
        // 换坦克
        if (type == 1) {
            if (roomPlayer.tankList.includes(state)) {
                roomPlayer.tankId = state;
            }
        }
        // 换道具
        else if (type == 2) {
            let tmpState = [];
            for (let v of state) {
                if (roomPlayer.propList.includes(v)) {
                    tmpState.push(v);
                }
            }
            roomPlayer.prop = tmpState;
        }
        // 准备
        else if (type == 3) {
            roomPlayer.ready = 1;
        }
        //换配件
        else if(type == 4){

            console.log("[change]:[parts] " + state);

            if (roomPlayer.partsPageList.hasOwnProperty(state)) {
                roomPlayer.partsPageId = state;
            }

        }
         else {
            return this.send(player.uid, proto.error("room_args_error"));
        }
        await manage.setRoomTeam(roomId, player.uid, roomPlayer);

        var msg = proto.roomState(roomId, player.uid, this._roomState(roomPlayer));
        this.sendAll(roomId, msg);
    }

    /**
     * 邀请玩家加入
     * @param  {[type]} player
     * @param  {[type]} roomId
     * @param  {[type]} tarUid
     * @param  {[type]} camp
     * @return {Promise}
     */
    async invite(player, roomId, tarUid, camp) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.error("room_not_create"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (roomInfo.isMatch) {
            return this.send(player.uid, proto.error("room_is_match"));
        }
        // 不是房主
        if (roomInfo.ownerUid != player.uid) {
            return this.send(player.uid, proto.error("room_not_owner"));
        }
        // 不能邀请自己
        if (tarUid == player.uid) {
            return this.send(player.uid, proto.error("room_target_self"));
        }
        // 不在房间中
        var roomPlayer = await manage.getRoomTeam(roomId, player.uid);
        if (!roomPlayer) {
            return this.send(player.uid, proto.error("room_not_join"));
        }
        // 目标玩家
        var tarPlayer = await manage.getPlayer(tarUid);
        if (!tarPlayer || tarPlayer.fd == 0) {
            return this.send(player.uid, proto.error("room_target_offline"));
        }
        // 正在战斗中
        var tarRoomId = await manage.getPlayerRoom(tarUid);
        if (tarRoomId) {
            return this.send(player.uid, proto.error("room_target_battle"));
        }

        // 邀请加入
        var msg = proto.invite(roomId, player.uid, player.baseInfo, roomInfo.key, this._getBaseInfo(roomInfo), camp);
        this.send(tarPlayer.uid, msg);
    }

    /**
     * 踢出玩家
     * @param  {[type]} player
     * @param  {[type]} tarUid
     * @return {Promise}
     */
    async tick(player, roomId, tarUid) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.error("room_not_create"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (roomInfo.isMatch) {
            return this.send(player.uid, proto.error("room_is_match"));
        }
        // 不是房主
        if (roomInfo.ownerUid != player.uid) {
            return this.send(player.uid, proto.error("room_not_owner"));
        }
        // 不能踢自己
        if (tarUid == player.uid) {
            return this.send(player.uid, proto.error("room_target_self"));
        }
        // 不在房间中
        var roomPlayer = await manage.getRoomTeam(roomId, player.uid);
        if (!roomPlayer) {
            return this.send(player.uid, proto.error("room_not_join"));
        }
        // 获取目标玩家
        var tarRoomPlayer = await manage.getRoomTeam(roomId, tarUid);
        if (!tarRoomPlayer) {
            return this.send(player.uid, proto.error("room_target_not_join"));;
        }
        // 删除玩家信息
        await Promise.all([
             manage.delPlayerRoom(tarUid),
             manage.delRoomTeam(roomId, tarUid)
         ]);
        // 通知目标被TICK
        var msg = proto.tick(roomId);
        this.send(tarRoomPlayer.uid, msg);

        // 通知其它玩家退出消息
        var msg = proto.roomOut(roomId, tarUid);
        this.sendAll(roomId, msg);
    }


    /**
     * 房主开始游戏
     * @param  {[type]} player
     * @return {Promise}
     */
    async start(player, roomId) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.error("room_not_create"));
        }
        // 类型不匹配
        if (manage.TYPE_MATCH_MODE.includes(roomInfo.type)) {
            return this.send(player.uid, proto.error("room_type_error"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (roomInfo.isMatch) {
            return this.send(player.uid, proto.error("room_is_match"));
        }
        // 不是房主
        if (roomInfo.ownerUid != player.uid) {
            return this.send(player.uid, proto.error("room_not_owner"));
        }
        // 队伍列表
        var teamList = await manage.getRoomTeam(roomId);
        // 不在房间中
        var roomPlayer = teamList[player.uid];
        if (!roomPlayer) {
            return this.send(player.uid, proto.error("room_not_join"));
        }
        // 判断阵营
        var allReady = true;
        var campNum1 = 0;
        var campNum2 = 0;
        var stateList = {};
        var teamUids = [];
        for (let uid in teamList) {
            let tarPlayer = teamList[uid];
            // 不是房主且有玩家没有准备
            if (tarPlayer.ready == 0 && uid != roomInfo.ownerUid) {
                allReady = false;
            }
            if (tarPlayer.camp == 1) {
                campNum1++;
            } else if (tarPlayer.camp == 2) {
                campNum2++;
            }
            stateList[uid] = this._roomState(tarPlayer);
            teamUids.push(uid);
        }

        // 没有全部准备
        if (!allReady) {
            return this.send(player.uid, proto.error("room_not_allready"));
        }
        // 友谊赛
        if (roomInfo.type == manage.TYPE_FRIENDSHIP) {
            if (campNum1 < 1 || campNum2 < 1) {
                return this.send(player.uid, proto.error("room_wait_player"));
            }
        }

        // 匹配赛 寻找AI
        if (roomInfo.type == manage.TYPE_MATCHING) {
            var needNum1 = 1;
            var needNum2 = 2;
            var aiTeamList = {};
            // 获取AI数据=
            var userAiList = await dbModel.getAiList(needNum1 + needNum2, teamUids);
            // 阵营1 Ai pos 从1开始
            let pos = 1;
            for (let i = 0; i < needNum1; i++) {
                let aiPlayer = userAiList.pop();
                let uid = aiPlayer.uid;
                aiPlayer.roomId = roomId;
                aiPlayer.camp = 1;
                aiPlayer.pos = pos;
                aiTeamList[uid] = aiPlayer;
                pos++;
            }
            // 阵营2AI
            pos = 0;
            for (let i = 0; i < needNum2; i++) {
                let aiPlayer = userAiList.pop();
                let uid = aiPlayer.uid;
                aiPlayer.roomId = roomId;
                aiPlayer.camp = 2;
                aiPlayer.pos = pos;
                aiTeamList[uid] = aiPlayer;
                pos++;
            }
            await manage.setRoomTeam(roomId, aiTeamList);
        }

        // 通知战斗服务器游戏开始
        var battleServer = await manage.getBattleServer();
        if (!battleServer) {
            return this.send(player.uid, proto.error("room_battle_closed"));
        }

        // 获取战斗信息
        var battleInfo = await dbModel.roomStart(roomId, stateList);
        if (!battleInfo) {
            return this.send(player.uid, proto.error("room_http_error"));
        }

        // 标记游戏开始
        roomInfo.isStart = 1;
        await Promise.all([
             manage.setRoomInfo(roomId, roomInfo),
             manage.setRoomExpire(roomId, manage.START_EXPIRE_TIME)
         ]);
        // 通知战斗服务器
        this.remote.emitTo(battleServer.nsp, "start", battleInfo);

        var msg = proto.start(roomId, battleServer, {
            type: roomInfo.type,
            typeId: roomInfo.typeId
        });
        this.sendAll(roomId, msg, teamUids);
    }

    /**
     * 开始匹配
     * @param  {[type]} player
     * @param  {[type]} roomId
     * @return {Promise}
     */
    async match(player, roomId) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.error("room_not_create"));
        }
        // 类型不匹配
        if (!manage.TYPE_MATCH_MODE.includes(roomInfo.type)) {
            return this.send(player.uid, proto.error("room_type_error"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (roomInfo.isMatch) {
            //return this.send(player.uid, proto.error("room_is_match"));
        }
        // 不是房主
        if (roomInfo.ownerUid != player.uid) {
            return this.send(player.uid, proto.error("room_not_owner"));
        }
        // 队伍列表
        var teamList = await manage.getRoomTeam(roomId);
        // 不在房间中
        var roomPlayer = teamList[player.uid];
        if (!roomPlayer) {
            return this.send(player.uid, proto.error("room_not_join"));
        }
        // 判断阵营
        var allReady = true;
        var campNum1 = 0;
        var campNum2 = 0;
        var stateList = {};
        for (let uid in teamList) {
            let tarPlayer = teamList[uid];
            // 不是房主且有玩家没有准备
            if (tarPlayer.ready == 0 && uid != roomInfo.ownerUid) {
                allReady = false;
            }
            if (tarPlayer.camp == 1) {
                campNum1++;
            } else if (tarPlayer.camp == 2) {
                campNum2++;
            }
            stateList[uid] = this._roomState(tarPlayer);
        }

        // 没有全部准备
        if (!allReady) {
            return this.send(player.uid, proto.error("room_not_allready"));
        }

        // 标记游戏匹配中
        roomInfo.isMatch = 1;
        await Promise.all([
             manage.setRoomInfo(roomId, roomInfo)
         ]);
        // 通知匹配服务器
        this.remote.emitTo(manage.REMOTE_MATCH_NSP, "start", roomId, roomInfo, teamList);
        var msg = proto.match(roomId, manage.MATCH_WAIT_TIME);
        this.sendAll(roomId, msg);
    }

    async cancel(player, roomId) {
        var roomInfo = await manage.getRoomInfo(roomId);
        if (!roomInfo) {
            return this.send(player.uid, proto.cancel(roomId));
            //return this.send(player.uid, proto.error("room_not_create"));
        }
        // 类型不匹配
        if (!manage.TYPE_MATCH_MODE.includes(roomInfo.type)) {
            return this.send(player.uid, proto.error("room_type_error"));
        }
        // 已开始
        if (roomInfo.isStart) {
            return this.send(player.uid, proto.error("room_is_start"));
        }
        // 正在匹配中
        if (!roomInfo.isMatch) {
            return this.send(player.uid, proto.error("room_not_match"));
        }
        // 不是房主
        if (roomInfo.ownerUid != player.uid) {
            // return this.send(player.uid, proto.error("room_not_owner"));
        }
        // 通知匹配服务器
        this.remote.emitTo(manage.REMOTE_MATCH_NSP, "cancel", roomId, roomInfo);
    }




    /**
     * 清除房间数据
     * @param  {[type]} roomId
     * @param  {[type]} [uidList=null]
     * @return {Promise}
     */
    async _clearRoom(roomId, uidList = null) {
        console.log("ClearRoom:", roomId, uidList);
        if (!uidList) {
            var uidList = await manage.getRoomUidList(roomId);
        }
        var queue = [];
        // 移除所有玩家
        for (let uid of uidList) {
            queue.push(manage.delPlayerRoom(uid));
        }
        // 删除房间
        queue.push(manage.delRoomInfo(roomId));
        // 删除队伍信息
        queue.push(manage.delRoomTeam(roomId));
        await Promise.all(queue);
    }

    _roomState(player) {
        return [player.camp, player.pos, player.tankId, player.prop, player.ready,player.partsPageId];
    }

    _getBaseInfo(roomInfo) {
        return {
            roomId: roomInfo.roomId,
            ownerUid: roomInfo.ownerUid,
            type: roomInfo.type,
            typeId: roomInfo.typeId,
            isStart: roomInfo.isStart
        };
    }

    /**
     * 发送所有信息
     * @param  {[type]} msg
     * @param  {[type]} [fiterUid=null]
     * @return {Promise}
     */
    async sendAll(roomId, msg, uidList = null, fiterUid = null) {
        if (!uidList) {
            var uidList = await manage.getRoomUidList(roomId);
        }
        var queue = [];
        for (let uid of uidList) {
            if (uid != fiterUid) {
                queue.push(this.send(uid, msg));
            }
        }
        await Promise.all(queue);
    }

    /**
     * 发送信息
     * @param  {[type]} fd
     * @param  {[type]} msg
     * @return {Promise}
     */
    async send(uid, msg) {
        await this.remote.emitTo(manage.REMOTE_CHAT_NSP, "sendUid", uid, msg);
    }

}

module.exports = new RoomManage();
