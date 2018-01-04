/**
 * @Author: wbsifan
 * @Date:   2017-05-10T15:49:59+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 19-Oct-2017
 */
"use strict";
// 加载配置文件
const config = require("./config");
const manage = require("./manage");
const Remote = require("weejs/remote");
const dbModel = require("./db-model");
const proto = require("./proto");
const debug = require("debug")("wee:match-index");



// 2v2
const MIN_PLAYER_NUM = 2;



class Match {
    constructor() {
        this.queueList = new Map();
        this.matchList = new Map();
        this.remote = Remote.create({
            subRedis: manage.subRedis,
            pubRedis: manage.pubRedis
        }, manage.REMOTE_MATCH_NSP);
        this.remote.on("start", (roomId, roomInfo, teamList) => {
            this.onStart(roomId, roomInfo, teamList);
        });
        this.remote.on("cancel", (roomId, roomInfo) => {
            this.onCancel(roomId, roomInfo);
        });
        this.isUpdate = false;
        setInterval(() => {
            this.update();
        }, manage.MATCH_UPDATE_TIME);
        setTimeout(() => {
            this.update();
        }, 100);
    }

    async update() {
        if (this.isUpdate) {
            return;
        }
        this.isUpdate = true;

        var startTime = Date.now();
        var roomList = new Map();
        var matchIndex = 0;
        var totalNum = this.queueList.size;
        // 开始匹配玩家
        for (let [queueIndex, queue] of this.queueList) {
            matchIndex++;
            // 生成临时对象
            let matchQueue = {
                num: 0,
                time: startTime,
                teamList: {},
                srcQueue: {}
            };
            this.queueList.delete(queueIndex);
            matchQueue.num = queue.num;
            matchQueue.time = Math.min(matchQueue.time, queue.time);
            matchQueue.teamList = Object.assign(matchQueue.teamList, queue.teamList);
            matchQueue.srcQueue[queueIndex] = queue;

            this.matchList.set(matchIndex, matchQueue);
            // 房间已满跳到下一个循环
            if (matchQueue.num == MIN_PLAYER_NUM) {
                continue;
            }
            // 房间未满继续匹配
            for (let [k, v] of this.queueList) {
                let tmpNum = matchQueue.num + v.num;
                if (tmpNum > MIN_PLAYER_NUM) {
                    continue;
                } else {
                    this.queueList.delete(k);
                    matchQueue.num = tmpNum;
                    matchQueue.time = Math.min(matchQueue.time, v.time);
                    matchQueue.teamList = Object.assign(matchQueue.teamList, v.teamList);
                    matchQueue.srcQueue[k] = v;
                    if (queue.num == MIN_PLAYER_NUM) {
                        break;
                    }
                }
            }
        }

        // 组成新的对战房间
        for (let [matchIndex, matchQueue] of this.matchList) {
            if (matchQueue.num < MIN_PLAYER_NUM) {
                continue;
            }
            for (let [k, v] of this.matchList) {
                if (matchIndex == k || v.num < MIN_PLAYER_NUM) {
                    continue;
                }
                let roomIndex = matchIndex;
                let roomQueue = {
                    teamList1: matchQueue.teamList,
                    teamList2: v.teamList,
                    srcQueue: {}
                };
                Object.assign(roomQueue.srcQueue, matchQueue.srcQueue, v.srcQueue);

                roomList.set(roomIndex, roomQueue);
                this.matchList.delete(matchIndex);
                this.matchList.delete(k);
                break;
            }
        }


        // debug(`共${totalNum}个玩家匹配, 成功匹配到`, roomList.size, "个房间, 剩余", this.matchList.size, "开始匹配AI, 共用时:", (endTime - startTime) / 1000, "s");

        // 处理未匹配到的房间
        for (let [matchIndex, matchQueue] of this.matchList) {
            for (let srcRoomId in matchQueue.srcQueue) {
                let srcQueue = matchQueue.srcQueue[srcRoomId];
                this.queueList.set(srcRoomId, srcQueue);
                this.matchList.delete(matchIndex);
            }
        }


        // 处理已经匹配到的房间
        for (let [roomIndex, roomQueue] of roomList) {
            debug(">匹配到房间");
            let roomId = await this.makeRoomId();
            let roomInfo = this.makeRoomInfo(roomId, roomQueue.srcQueue);
            let teamList = {};
            // 阵营1
            let pos = 0;
            for (let uid in roomQueue.teamList1) {
                let roomPlayer = roomQueue.teamList1[uid];
                roomPlayer.roomId = roomId;
                roomPlayer.camp = 1;
                roomPlayer.pos = pos;
                teamList[uid] = roomPlayer;
                pos++;
            }
            // 阵营2
            pos = 0;
            for (let uid in roomQueue.teamList2) {
                let roomPlayer = roomQueue.teamList2[uid];
                roomPlayer.roomId = roomId;
                roomPlayer.camp = 2;
                roomPlayer.pos = pos;
                teamList[uid] = roomPlayer;
                pos++;
            }
            this.battleStart(roomId, roomInfo, teamList);
        }

        // 处理单人游戏AI机器人
        var endTime = Date.now();
        for (let [queueIndex, queue] of this.queueList) {
            debug(">AI-START: teamList = ", Object.keys(queue.teamList), "roomId = ", queueIndex);
            // 多人模式或者未到匹配时间不处理
            if (queue.num > 1 || endTime - queue.time < manage.MATCH_WAIT_TIME) {
                continue;
            }

            let needNum1 = MIN_PLAYER_NUM - queue.num;
            let needNum2 = MIN_PLAYER_NUM;
            let teamUids = Object.keys(queue.teamList);
            let srcQueue = {};
            srcQueue[queueIndex] = queue;
            dbModel.getAiList(needNum1 + needNum2, teamUids).then(async(userAiList) => {
                debug(">AI-DONE: teamList = ", Object.keys(queue.teamList), "SrcRoom = ", queueIndex);
                let roomId = await this.makeRoomId();
                let roomInfo = this.makeRoomInfo(roomId, srcQueue);
                let teamList = {};

                // 阵营1
                let pos = 0;
                for (let uid in queue.teamList) {
                    let roomPlayer = queue.teamList[uid];
                    roomPlayer.roomId = roomId;
                    roomPlayer.camp = 1;
                    roomPlayer.pos = pos;
                    teamList[uid] = roomPlayer;
                    pos++;
                }
                // 阵营1 Ai
                for (let i = 0; i < needNum1; i++) {
                    let roomPlayer = userAiList.pop();
                    let uid = roomPlayer.uid;
                    roomPlayer.roomId = roomId;
                    roomPlayer.camp = 1;
                    roomPlayer.pos = pos;
                    teamList[uid] = roomPlayer;
                    pos++;
                }
                // 阵营2AI
                pos = 0;
                for (let i = 0; i < needNum2; i++) {
                    let roomPlayer = userAiList.pop();
                    let uid = roomPlayer.uid;
                    roomPlayer.roomId = roomId;
                    roomPlayer.camp = 2;
                    roomPlayer.pos = pos;
                    teamList[uid] = roomPlayer;
                    pos++;
                }
                // 通知战斗开始
                this.battleStart(roomId, roomInfo, teamList);
            });
            this.queueList.delete(queueIndex);
        }

        this.isUpdate = false;
    }

    async makeRoomId() {
        return manage.TYPE_COMPETE + "-" + await manage.makeMatchRoomId();
    }

    makeRoomInfo(roomId, srcQueue) {
        var key = wee.uniqid();
        var sTime = Math.floor(Date.now() / 1000);
        var roomInfo = {
            roomId: roomId,
            srcRoomTeam: {},
            ownerUid: 0,
            type: 6,
            typeId: 0,
            teamNum1: MIN_PLAYER_NUM,
            teamNum2: MIN_PLAYER_NUM,
            time: sTime,
            key: key,
            isStart: 1,
            isMatch: 0
        }
        for (let queueIndex in srcQueue) {
            roomInfo.srcRoomTeam[queueIndex] = Object.keys(srcQueue[queueIndex].teamList);
        }
        return roomInfo;
    }

    async battleStart(roomId, roomInfo, teamList) {
        // 通知战斗服务器游戏开始
        var battleServer = await manage.getBattleServer();
        if (!battleServer) {
            return this.sendAll(roomId, proto.error("room_battle_closed"), teamList);
        }

        var queue = [];
        queue.push(manage.setRoomInfo(roomId, roomInfo));
        queue.push(manage.setRoomTeam(roomId, teamList));
        // 更新战斗过期时间
        queue.push(manage.setRoomExpire(roomId, manage.START_EXPIRE_TIME));
        // 更新player => roomId
        for (let uid in teamList) {
            let roomPlayer = teamList[uid];
            if (roomPlayer.ai != 1) {
                queue.push(manage.setPlayerRoom(uid, roomId));
            }
        }
        // 删除原匹配房间
        for (let srcRoomId in roomInfo.srcRoomTeam) {
            queue.push(manage.delRoomInfo(srcRoomId));
            queue.push(manage.delRoomTeam(srcRoomId));
        }
        await Promise.all(queue);

        // 获取战斗信息
        var battleInfo = await dbModel.roomStart(roomId);
        if (!battleInfo) {
            return this.sendAll(roomId, proto.error("room_http_error"), teamList);
        }
        // 通知战斗服务器
        this.remote.emitTo(battleServer.nsp, "start", battleInfo);

        var msg = proto.start(roomId, battleServer, {
            type: roomInfo.type,
            typeId: roomInfo.typeId
        });
        this.sendAll(roomId, msg, teamList);
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

    /**
     * 发送所有信息
     * @param  {[type]} msg
     * @param  {[type]} [fiterUid=null]
     * @return {Promise}
     */
    async sendAll(roomId, msg, teamList = null, fiterUid = null) {
        if (!teamList) {
            var teamList = await manage.getRoomTeam(roomId);
        }
        var queue = [];
        for (let uid in teamList) {
            let roomPlayer = teamList[uid];
            if (roomPlayer.ai != 1 && uid != fiterUid) {
                queue.push(this.send(uid, msg));
            }
        }
        await Promise.all(queue);
    }

    /**
     * 添加到匹配队列
     * @param  {[type]} roomId
     * @param  {[type]} roomInfo
     * @param  {[type]} teamList
     * @return {[type]}
     */
    async onStart(roomId, roomInfo, teamList) {
        roomId = roomId.toString();
        debug("onStart", roomId);
        this.queueList.set(roomId, {
            roomId: roomId,
            roomInfo: roomInfo,
            teamList: teamList,
            num: wee.count(teamList),
            time: Date.now()
        });
    }

    async onOut(player, roomId) {
        console.log("out", player, roomId);
    }

    async onCancel(roomId, roomInfo) {
        roomId = roomId.toString();
        debug("onCancel", roomId);
        if (this.queueList.has(roomId)) {
            delete this.queueList.delete(roomId);
            roomInfo.isMatch = 0;
            await Promise.all([
                manage.setRoomInfo(roomId, roomInfo)
            ]);
            var msg = proto.cancel(roomId);
            this.sendAll(roomId, msg);
        }
    }
}


const match = new Match();
