/**
 * @Author: wbsifan
 * @Date:   23-Oct-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 24-Oct-2017
 */



'use strict'

const SOCK = require("./sockClient").Sock;

const gameConfig = require("./gameConfig").gameConfig;

const fs = require('fs');

const SERVER_CONST = require("./const").SERVER_CONST;
const WebSocketOrder = require("./const").WebSocketOrder;

const ActionManager = require("./tank").ActionManager;

const RoomModel = require("./roomModel").RoomModel;

const FIGHT_OVER_FLAG = require("./const").FIGHT_OVER_FLAG;

const getFromMap = require("./utils").getFromMap;

const MY_DATA = require("./utils").MY_DATA;

const dbBattle = require("./lib/db-battle");

const TIME_OFFSET = 1000000;

const DATA_MAX_SIZE = 1000;

const getMD5 = require("./utils").getMD5;
const xor = require("./utils").xor;


const CMD_FLAG = {
    ENTER: "0",
    FIGHT: "1",
    RE_CONN: "2",
    REJECT: "3",
    ASSETS: "4"
};

const ENTER_DATA = new Buffer(JSON.stringify([[-5], {
    "t": CMD_FLAG.ENTER,
    "st": SERVER_CONST.CLIENT_COMMAND_TIME,
    "lt": SERVER_CONST.CLIENT_LOG_TIME,
    "mt": SERVER_CONST.CLIENT_MOVE_TIME,
    "timeout": SERVER_CONST.CLIENT_TIMEOUT,
    "bt": SERVER_CONST.CLIENT_BUFF_TIME,
    "AMT" : SERVER_CONST.CLIENT_KEEP_MOVE_TIME,
    "MMT" : SERVER_CONST.CLIENT_MAX_MOVE_TIME
}]));


// const PVP_ENTER_DATA = new Buffer(JSON.stringify([[-5], {
//     "t": CMD_FLAG.ENTER,
//     "st": 80,
//     "lt": 80,
//     "mt": 80,
//     "timeout": 5,
//     "bt": 3,
//     "AMT" : 40,
//     "MMT" : 120
// }]));

/**
 * 战斗进行时房间
 */
class Room {

    // constructor(rid,userNum=1){
    constructor(rid, data) {
        console.log("=====>roomData:" + JSON.stringify(data));
        //房间id
        this.rid = rid;
        this.sockList = [];

        this.sockMap = new Map();

        // this.userNum = data.userList.getSize();
        // this.userNum = userNum;
        this.actionList = [];
        this.currentFrameIndex = 0;
        this.roomRunTime = 0;
        this.frameTime = SERVER_CONST.SERVER_COMMAND_TIME;
        this.readyCount = 0;

        this.sysTime = 0;

        this.messageMap = new Map();
        this.actionManager = new ActionManager();

        this.roomModel = new RoomModel(rid);

        this.roomModel.initFightData(data);
        this.play_uid_set = new Set();
        this.userNum = 0;
        for (let id in data.userList) {
            this.play_uid_set.add(data.userList[id].userInfo.uid);
            // this.play_uid_set.add(data.userList[id].userInfo.uid);//sid
            if (data.userList[id].ai == 0) {
                this.userNum++;
                console.log("add uid " + data.userList[id].userInfo.uid + " to room " + this.rid);
            }
            //console.log("add uid " +  data.userList[id].userInfo.uid + " to room " + this.rid + " type " + typeof data.userList[id].userInfo.uid);
        }

        // dbBattle.getData(rid).then((res) => {
        // 	if(res){
        // 		this.roomModel.initFightData(res);
        // 	}
        // }).catch(err => {
        // 	console.log(err);
        // });

        this.startToBroadMsg = false;

        /**
         * 是否发送了结束标记
         * @type {boolean}
         */
        this.sendFinishFlag = false;

        this.finishReason = -1;

        this.fightResult = "";

        this.isWin = false;

        this.isGameOver = false;

        this.has_notifi_game_over = false;

        this.ready_fight_timeout = -1;
        this.isStartToFight = false;
        this.room_wait_timeout = setTimeout(() => {
            console.log("超时，退出房间 id = " + this.room_wait_timeout);
            this.finishReason = FIGHT_OVER_FLAG.TIME_OUT;
            this.sendFinishFlag = true;
            this.noticeFightResult();
        }, SERVER_CONST.ROOM_WAIT);

        this.READY_DATA = null;

        //为了过滤过多重连帧  拿着也没用的
        this.quit_map = new Map();

        this.room_style = 1;

        this.player_quit_num = 0;


        this.kcpManager = require("./kcpManager").KCPManager;

        /**
         * 当前接管ai的玩家
         * @type {number}
         */
        this.current_ai_control_uid = -1;
        this.room_command = [];
    }


    valid_uid(uid) {
        // return true;
        let b = this.play_uid_set.has(uid);
        if (!b) {
            console.log("current room " + this.rid + " can not find " + uid + " type = " + typeof uid)
        }
        return b;
    }


    update(dt, now) {
        this.sysTime = now;
        // this.roomRunTime += dt;
        if (this.sendFinishFlag) {
            // for (let sock of this.sockList) {
            //     sock.sendKeepAlive(now);
            // }

            for(let [_,sock] of this.sockMap){
				sock.sendKeepAlive(now);
            }
            return;
        } else {

            // for (let sock of this.sockList) {
            //     !sock.isReady && sock.sendKeepAlive(now);
            // }

			for (let [_,sock] of this.sockMap) {
				!sock.isReady && sock.sendKeepAlive(now);
			}
        }

        if (!this.startToBroadMsg || !this.roomModel.roomDataReady) return;
        this.roomRunTime += dt;
        this.roomModel.update(dt);
        //-----------------
        var actions = this.actionManager.getAllActions();
        var exterActions = this.roomModel.getActions();
        exterActions.length > 0 && actions.merge(exterActions);
        if (this.room_command.length > 0) {
            actions.merge(this.room_command);
            this.room_command.length = 0;
        }
        this.roomModel.syncAction(actions);
        actions.unshift([++this.currentFrameIndex]);

        //这里判定一下游戏状态
        if (this.roomModel.allAIDead) { // && !this.roomModel.hasRandomAITank()){
            this.finishReason = FIGHT_OVER_FLAG.KILL_ALL_AI;
            this.sendFinishFlag = true;
            this.isWin = true;
        } else if (this.roomModel.livePlayerCount == 0) {
            this.finishReason = FIGHT_OVER_FLAG.ALL_PLAYER_DIED;
            this.sendFinishFlag = true;
        } else if (this.roomModel.isMainBaseDead) {
            this.finishReason = FIGHT_OVER_FLAG.MAIN_BASE_BE_DESTORY;
            this.sendFinishFlag = true;
        } else if (this.roomRunTime > this.roomModel.totalGameTime) {
            // else if(this.roomRunTime > 10000){
            this.finishReason = FIGHT_OVER_FLAG.TIME_OUT;
            this.sendFinishFlag = true;
            console.log("--------- game timeout");
        }

        this.broadcastMsg(actions, now);
        this.sendFinishFlag && this.noticeFightResult();
        this.actionManager.cleanup();
        //-----------------
    }

    broadcastAssetsPro(uid, p) {
        let msg = new Buffer(JSON.stringify([[-7], { t: CMD_FLAG.ASSETS, d: [uid, p] }]));
        // for (let sock of this.sockList) {
        for (let [_,sock] of this.sockMap) {
            sock.send(msg, Date.now());
            //console.log("send to client is " + msg);
        }
    }


    broadcastMsg(data, now) {
        if (data) {
            let data_str = JSON.stringify(data);
            // data_str =  getMD5(data_str).substr(12,8) + xor.encodeMsg(data_str);
            data_str = getMD5(data_str).substr(12, 8) + data_str;
            // data_str = xor.encodeMsg(data_str);
            // console.log("send message to client is " + data_str);
            if (data_str.length < DATA_MAX_SIZE) {
                let msg = new Buffer(data_str);
                // for (let sock of this.sockList) {
                for (let [_,sock] of this.sockMap) {
                    sock.send(msg, now);
                }
                this.messageMap.set("f:" + data[0][0], data_str);
            } else {
                var info = JSON.stringify([[data[0][0]]]);
                info = getMD5(info).substr(12, 8) + info;
                // info = xor.encodeMsg(info);
                // this.messageMap.set("f:"+data[0][0],getMD5(info).substr(12,8) +  xor.encodeMsg(info));
                this.messageMap.set("f:" + data[0][0], info);
                console.log("set info:" + info);
                console.log("rid:" + this.rid + " data len more than " + DATA_MAX_SIZE + " so ingore " + data_str);
            }
        }
    };

    finishSock(id) {
        // this.removeSock(id, "battle over") && this.sockList.length == 0 && this.noticeFightResult();
        this.removeSock(id, "battle over",false) && this.sockMap.size == 0 && this.noticeFightResult();
    }

    noticeFightResult() {
        if (this.has_notifi_game_over) {
            return;
        }
        this.has_notifi_game_over = true;
        this.sendFinishFlag = true;
        this.fightResult = this.roomModel.showFightRecode();
        let cmd = [12, this.finishReason, this.fightResult[1]];
        manager.addFinsihCmd(this.rid, JSON.stringify([[-7], { "t": CMD_FLAG.REJECT, "d": cmd }]));

        //console.log("------------------ noticeFightResult:" + JSON.stringify(manager.getFinishCmd(this.rid)));
        let leftTime = Math.max(0, Math.floor((this.roomModel.totalGameTime - this.roomRunTime) * 0.001));
        console.log("this.roomRunTime = " + this.roomRunTime);

        console.log("==================> over " + this.rid + "  finishReason = " + this.finishReason);

        dbBattle.battleOver(this.rid, { win: this.isWin ? 1 : 0, data: this.fightResult[0], leftTime: leftTime }, this.room_style).then((res) => {
            console.log("broadcast" + this.rid + " game over " + JSON.stringify(res));
            this.broadcastMsg([[++this.currentFrameIndex], cmd], Date.now());
            setTimeout(() => {
                // for (let sock of this.sockList) {
                for (let [_,sock] of this.sockMap) {
                    this.kcpManager.deleteKcp(sock.kcpDelegate.key, this.rid, "4秒后删除房间");
                }
                this.gameOver();
            }, 4000);

        });
    }

    removeSock(id, reason = "", loseUser = false) {

    	if(this.sockMap.has(id)){
    		let  sock = this.sockMap.get(id);
    		if(sock){
				this.kcpManager.deleteKcp(sock.kcpDelegate.key, this.rid, reason + id);
				// this.sockList.splice(i, 1);
				this.sockMap.delete(id);
				sock.dispose();
				console.log("remove sock:" + id + " , successfully");
				//换接管AI的玩家
				//this.onPlayerOut(id);
				return true;
    		}
    	}

    	return false;

        // for (let i = 0, sock, len = this.sockList.length; i < len; i++) {
        //     sock = this.sockList[i];
        //     if (sock.id == id) {
        //         this.kcpManager.deleteKcp(sock.kcpDelegate.key, this.rid, reason + id);
        //         this.sockList.splice(i, 1);
        //         sock.dispose();
        //         console.log("remove sock:" + id + " , successfully");
        //         //换接管AI的玩家
        //         //this.onPlayerOut(id);
        //         return true;
        //     }
        // }
        //
        // return false;
    }

    onPlayerOut(uid) {
        this.current_ai_control_uid == uid && this.changeAIControlPLayer();
    }

    /**
     * 获取房主ID  -1表示不采用房主模式
     * @returns {number|*}
     */
    getAIControlPlayerUid() {

        // this.current_ai_control_uid = this.sockList[Math.floor(Math.random() * this.sockList.length)].id;
        let keys = this.sockMap.keys();
        this.current_ai_control_uid = keys[Math.floor(Math.random() * keys.length)];
        return this.current_ai_control_uid;
    }

    changeAIControlPLayer() {
        // let len = this.sockList.length;
        // if(len > 0) {
        // 	this.room_command[this.room_command.length] = [WebSocketOrder.CONTROL_AI,this.getAIControlPlayerUid()];
        // }
    }

    find_sock(id) {
        // for (let i = 0, sock, len = this.sockList.length; i < len; i++) {
        //     sock = this.sockList[i];
        //     if (sock.id == id) {
        //         return sock;
        //     }
        // }

        return this.sockMap.get(id);

        return null;
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        manager.removeRoom(this.rid);
        this.fightResult && console.log("fight recode:\n" + JSON.stringify(this.fightResult));
        this.kcpManager.roomOut(this.rid);
        console.log("------------------------------ gameOver ---------------------------" + Date.now());
    }

    addSock(server_id, kcpDelegate) {
        let sock = new SOCK(server_id, kcpDelegate, this);
        // this.sockList[this.sockList.length] = sock;
		this.removeSock(server_id,"client lose connect",true);
        this.sockMap.set(server_id,sock);
        sock.send(ENTER_DATA, this.sysTime);

    }

    //id,tank_id,ws,camp,props
    //this.socket_id,this.roomModel.roomIndex,this.roomModel.gameTimeLine.getCurrentFrame()
    /**
     * "reCoon",this.socket_id,this.roomModel.roomIndex,this.roomModel.gameTimeLine.getCurrentServerFrame() + 1
     * [roomInfo.get_server_ready?1:0,roomInfo.get_server_ready?1:0, roomInfo.get_server_asset?-1:roomInfo.currentLoadAssetsPercent]
     * @param data []
     * @param kcpDelegate
     */
    clientReConnection(data, kcpDelegate) {
        let uid = data[1];

        if (this.quit_map.has(uid)) {
			kcpDelegate.bindUID(uid);
			kcpDelegate.send(msg,now)(new Buffer(JSON.stringify([[-6], { "t": CMD_FLAG.RE_CONN, "d": this.quit_map.get(uid), "r": true }])), this.sysTime);
        } else {
            // this.sockList[this.sockList.length] = sock;
			this.removeSock(uid,"client lose connect",true);

			let sock = new SOCK(uid, kcpDelegate, this);
            this.sockMap.set(uid,sock);

            if (data.length == 5) {
                let status_data = data[4];
                //没有收到服务器广播的连接服务器成功响应
                if (status_data[0] == 0) {
                    sock.send(ENTER_DATA, this.sysTime);
                }

                if (status_data[1] == 0) {
                    this.clientReady(uid);
                } else {
                    sock.readyFight();
                }

                if (status_data[2] != -1) {
                    this.broadcastAssetsPro(uid, status_data[2]);
                }

                //drop battle cmd
                if (status_data[3] == 0) {
                    this.quit_map.set(uid, JSON.stringify([WebSocketOrder.PLAYER_QUIT, uid]));
                }
            }
            this.reqLoseFrameData(sock, data[3]);
        }
    }

    //客户端准备好了
    clientReady(id) {

		let sock = this.sockMap.get(id);
		if(sock){
			this.readyCount++;
			console.log(id + " has ready...... ready_cnt = " + this.readyCount + "  , userNum = " + this.userNum);
			if (this.isStartToFight) {
				//如果已经开始了
				sock.readyFight();
				sock.send(this.READY_DATA, this.sysTime);
				return;
			}
		}

        // for (let sock of this.sockList) {
        //     if (sock.id == id) {
        //         this.readyCount++;
        //         console.log(id + " has ready...... ready_cnt = " + this.readyCount + "  , userNum = " + this.userNum);
        //         if (this.isStartToFight) {
        //             //如果已经开始了
        //             sock.readyFight();
        //             sock.send(this.READY_DATA, this.sysTime);
        //             return;
        //         }
        //         break;
        //     }
        // }

        /**
         * 有一个玩家准备好了 再等10秒就开始游戏
         */
        if (this.readyCount == 1) {
            this.ready_fight_timeout = setTimeout(() => this.sendReadInfoToClients(2), SERVER_CONST.WAIT_OTHER_PLAYER);
        }

        if (this.readyCount == this.userNum) {
            this.sendReadInfoToClients(1);
        }
    }

    player_quit(uid) {
        
        if (!this.quit_map.has(uid)) {
            this.player_quit_num++;
            this.quit_map.set(uid, JSON.stringify([WebSocketOrder.PLAYER_QUIT, uid]));
            // if (this.sockList.length == 1) {
            if (this.sockMap.size == 1) {
                this.room_style = 0;
                this.roomRunTime = this.roomModel.totalGameTime - 50;
            // } else if (this.sockList.length == 2) {
            } else if (this.sockMap.size == 2) {
                if (this.player_quit_num == 1) {
                    if (this.roomModel.stillHasPlayer(uid)) {
                        dbBattle.battleUseProp(this.rid, uid, this.roomModel.getplayerPropUse(uid)).then((res) => {
                            res && this.roomModel.player_quit_room(uid);
                            setTimeout(() => this.removeSock(uid, uid + " request quit waiting two second", false), 2000);
                        });
                    } else {
                        this.room_style = 0;
                        this.roomRunTime = this.roomModel.totalGameTime - 50;
                    }
                } else if (this.player_quit_num == 2) {
                    this.room_style = 0;
                    this.roomRunTime = this.roomModel.totalGameTime - 50;
                }
            }

            // let sock = this.find_sock(uid);
            // if(sock){
            // 	sock.lock();
            // }

            //this.onPlayerOut(uid);
        }

        console.log(uid + " request quit battle");
        return true;
    }

    sendReadInfoToClients(v) {
        if (!this.isStartToFight) {
            this.cleanupTimeout();

            this.isStartToFight = true;

            this.READY_DATA = new Buffer(JSON.stringify([[-6],
                {
                    "t": CMD_FLAG.FIGHT,
                    "nt": Date.now(),
                    // "uid": this.getAIControlPlayerUid(),
                    // "ai_t": 2,
                    "pl_t": SERVER_CONST.CLIENT_AI_EXTER_FRAME,
                    "sd": Math.floor(Math.random() * 100000),
                    // "pl_ai_t": 1
                }]));

            // for (let sock of this.sockList) {
            for (let [_,sock] of this.sockMap) {
                sock.readyFight();
                sock.send(this.READY_DATA, this.sysTime);
            }
            this.initLoop();
            console.log(v == 1 ? "ready for fight all ready" : "wait player timeout");
        }
    }


    /**
     * 收到客户端信息
     * @param data
     */
    reciveActionsFromClient(data, uid) {
        //console.log("addAction frame = " + this.currentFrameIndex  + "  " + JSON.stringify(data));
        let actions = data[1];
        // if(data.length == 2 || this.roomModel.hasValidCMDIndex(uid,data[2])){


        let ret = this.roomModel.hasValidCMDIndex(uid, data[2]);

        switch (ret) {
            case 1:
                for (let i = 0, len = actions.length; i < len; i++) {
                    this.actionManager.handlerAction(actions[i], this.roomModel, this);
                }
                break;

            case 0:
                console.log("数据不对，玩家 " + uid + " 在作弊 " + JSON.stringify(data));
                break;

            case -1:
                console.log("玩家 " + uid + " 不存在房间");
                break;
        }

    }


    /**
     * 获取丢的帧数
     * @param id 客户端uid
     * @param frameIndex 该客户端本机存到的关键帧索引
     */
    reqLoseFrameData(findSock, frameIndex) {

        if (frameIndex > this.currentFrameIndex) {
            console.log("reqLoseFrameData frameIndex = " + frameIndex + " > this.currentFrameIndex " + this.currentFrameIndex);
            return;
        }
        // let findSock = null;
        // for(let sock of this.sockList){
        // 	if(sock.id == id){
        // 		findSock = sock;
        // 	}
        // }

        //var ret = [];
        let infoList = [];
        let len = 0;

        let extendInfo = "";
        let extendLen = 0;
        let SEND_DATA = null;
        for (let i = frameIndex; i <= this.currentFrameIndex; i++) {
            //ret[ret.length] = this.messageMap.get("f:" + i);
            extendInfo = this.messageMap.get("f:" + i);
            extendLen = extendInfo.length + 1;
            if (len + extendLen > 812) {
                SEND_DATA = new Buffer(JSON.stringify([[-6], { "t": CMD_FLAG.RE_CONN, "d": infoList.join("|"), "random": Math.random() }]));

                findSock.sendReCoon(SEND_DATA, this.sysTime);

                infoList.length = 0;
                len = 0;
            }

            len += extendLen;
            infoList[infoList.length] = extendInfo;

        }

        if (infoList.length > 0) {
            SEND_DATA = new Buffer(JSON.stringify([[-6], { "t": CMD_FLAG.RE_CONN, "d": infoList.join("|"), "random": Math.random() }]));
            findSock.sendReCoon(SEND_DATA, this.sysTime);
        }

    }

    startGame() {
        console.log("start Game");
        this.isRoomStart = true;
        manager.currentRoomStartGame();
    }

    initLoop() {
        this.startToBroadMsg = true;
    }

    clear() {
        this.sockList = null;
        this.actionList = null;
        this.room_command = null;

		this.sockMap.clear();
		this.sockMap = null;

        this.messageMap.clear();
        this.messageMap = null;

        this.quit_map.clear();
        this.quit_map = null;

        this.play_uid_set.clear();
        this.play_uid_set = null;

        this.actionManager.clear();
        this.actionManager = null;

        this.roomModel.clear();
        this.roomModel = null;

        this.room_command = null;
        this.cleanupTimeout();
    }

    cleanupTimeout(){
        if(this.room_wait_timeout != -1){
            clearTimeout(this.room_wait_timeout);
            this.room_wait_timeout = -1;
        }
        else{
            console.log("room_wait_timeout = " + this.room_wait_timeout);
        }


        if(this.ready_fight_timeout != -1){
            clearTimeout(this.ready_fight_timeout);
            this.ready_fight_timeout = -1;
        }
        else{
            console.log("ready_fight_timeout = " + this.ready_fight_timeout);
        }
    }

}

/**
 * 战斗记录保存时间（半分钟）
 * @type {number}
 */
const FIGHT_RECODE_KEEP_TIME = 30000;

/**
 * 检测超时战斗记录间隔（10秒）
 * @type {number}
 */
const FIGHT_RECODE_CHECK_TIME = 10000;

class RoomManager {
    constructor() {
        this.roomMap = new Map();
        this.nowTime = Date.now();
        setInterval(() => {
            let time = Date.now();
            let detal = time - this.nowTime;
            for (let [_k, room] of this.roomMap) {
                room.update(detal, time);
            }

            this.nowTime = time;

        }, SERVER_CONST.SERVER_COMMAND_TIME);

        this.finishRecodeMap = new Map();


        setInterval(() => {
            let now = Date.now();
            let remove_ids = [];
            for (let [_k, data] of this.finishRecodeMap) {
                if ((now - data.time) > FIGHT_RECODE_KEEP_TIME) {
                    remove_ids[remove_ids.length] = _k;
                }
            }

            let len = remove_ids.length;
            if (len > 0) {
                for (let i = 0, len = remove_ids.length; i < len; i++) {
                    this.finishRecodeMap.delete(remove_ids[i]);
                }
                //console.log("remove fight recode:" + JSON.stringify(remove_ids));
            }

            //console.log("check-num", "roomMap=", this.roomMap.size, "finishRecodeMap=", this.finishRecodeMap.size, );
        }, FIGHT_RECODE_CHECK_TIME);
    }

    getFinishCmd(rid) {
        rid = "" + rid;
        return this.finishRecodeMap.has(rid) ? this.finishRecodeMap.get(rid).data : null;
    }

    addFinsihCmd(rid, data) {
        this.finishRecodeMap.set("" + rid, { "time": Date.now(), "data": data });
    }

    getRoom(rid) {
        return this.roomMap.get(rid);
    }

    newRoom(roomNum = 1, room_id) {
        return getFromMap(this.roomMap, room_id, () => new Room(room_id, roomNum));
    }

    /**
	 * 获取到了战斗数据
	 * {"roomInfo":{"serverId":"dev","roomId":611,"ownerUid":87,"type":2,"typeId":6,"teamNum1":2,"teamNum2":0,"time":1495865652,"key":"TrWVL3cM","isStart":0,"isOver":0},
	 *  "mapInfo":{"creater":"","mapId":6,"name":"","content":"eyJiYXRjaEluZm8iOnsicDEiOnsiOSI6IjEwMDAyIiwiNDciOiIxMDAwMSIsIjk3IjoiMTAwMDEiLCIxMjkiOiIxMDAwMiJ9LCJwMiI6eyI3IjoiMTAwMDMiLCIxMyI6IjEwMDA4IiwiNDYiOiIxMDAwMiIsIjExOCI6IjEwMDAzIiwiMTIzIjoiMTAwMDgiLCIxMjYiOiIxMDAwMiJ9LCJwMyI6eyIyOCI6IjEwMDAyIiwiNDkiOiIxMDAwNSIsIjk5IjoiMTAwMDUiLCIxMDgiOiIxMDAwMiJ9fSwibWFwSW5mbyI6WzAsMCwwLCIzNSIsIjM1IiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwiMzUiLCIzNSIsMCwiMzUiLCIzNSIsIjM1IiwiMzUiLCIzNSIsMCwwLCIzNSIsIjM1IiwwLCIzNSIsIjM1IiwiMzUiLCIzNSIsIjM1IiwwLDAsIjM1IiwiMzUiLCI1MSIsIjM1IiwiMzUiLDAsMCwwLDAsMCwiMzUiLCIzNSIsMCwiMzUiLCIzNyIsIjM1IiwiMzUiLDAsMCwwLCI1MCIsIjM1IiwwLDAsIjQiLDAsMCwwLDAsMCwiMzUiLCIzNSIsMCwiMzUiLCIzNyIsIjM1IiwiMzUiLDAsMCwwLCIzNSIsIjM1IiwiNTIiLCIzNSIsIjM1IiwiMzUiLCIzNSIsMCwwLDAsIjM1IiwiMzUiLDAsIjM1IiwiMzUiLCIzNSIsIjM1IiwwLDAsMCwiMzUiLCIzNSIsMCwiMzUiLCIzNSIsIjM1IiwiMzUiLDAsMCwwLDAsMCwwLCIzNSIsIjM1IiwiMzUiLCIzNSIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0sIm1hcFR5cGUiOm51bGwsIm1hcElkIjoiMTEyXzYiLCJzdHlsZUlkIjoiNSIsIm1hcE5hbWUiOiJub19uYW1lX0VYUE9SVCIsImJlU3Vycm91bmRlZCI6W119\n",
	 *  "stat":{"fight_times":0,"pass_times":0,"fail_times":0,"pass_rate":0,"level":1},"uid":0},
	 *  "userList":{"87":{"camp":1,"pos":0,"userInfo":{"uid":87,"name":"守护者伊迪斯","level":6},"tankInfo":{"tankId":15050,"survive":44,"attack":65,"assist":50,"ai_id":0,"attack_id":7101,"skill_id":7102,"level":1},"prop":{"30001":20,"30006":18,"30008":16}}}}
	 2017 - 05 - 27 14: 14 +08:00: 87 has ready......

	 * @param data
     */
    onRoomData(data) {

        let rid = data.roomInfo.roomId;
        let room = new Room(rid, data);
        this.roomMap.set(rid, room);
        console.log("get room " + rid + " ,data  type " + typeof rid);
    }

    removeRoom(rid) {
        // delete this.roomMap.delete(rid);
        if (this.roomMap.has(rid)) {
            let room = this.roomMap.get(rid);
            room.clear();
            this.roomMap.delete(rid);
        }

    }


    currentRoomStartGame() {
        //this.currentRoom = null;
    }


}

let manager = new RoomManager();

module.exports.RoomManager = manager;
