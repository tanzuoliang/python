/**
 * @Author: wbsifan
 * @Date:   20-Sep-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 22-Sep-2017
 */



'use strict';

const SERVER_CONST = require("./const.js").SERVER_CONST;
const roomManager = require("./room").RoomManager;
const xor = require("./utils").xor;
const getMD5 = require("./utils").getMD5;


function MessageHandler(msg, kcpDelegate) {
    if (!msg) return;
    //console.log("[reviver]:" + msg);
    if (msg.charAt(0) == "[") {
        if (msg.indexOf("][") != -1) {
            let list = msg.split("][");
            for (var i = 0, len = list.length; i < len; i++) {
                if (i == 0) {
                    postData(list[i] + "]", kcpDelegate);
                } else if (i == len - 1) {
                    postData("[" + list[i], kcpDelegate);
                } else {
                    postData("[" + list[i] + "]", kcpDelegate);
                }
            }

            if (msg[msg.length - 1] != "&") {
                console.log("粘包了:" + msg);
            }
        } else {
            postData(msg, kcpDelegate);
        }
    } else {
        let list = msg.split("&");
        for (let i = 0, len = list.length; i < len; i++) {
            list[i] && postData(list[i], kcpDelegate)
        }

        if (msg[msg.length - 1] != "&") {
            console.log("md5粘包了:" + msg);
        }
    }


}


function postData(rmsg, kcpDelegate) {
    // rmsg = xor.update(rmsg);
    // rmsg = xor.decodeMsg(rmsg);
    // console.log("msg is " + rmsg);
    let msg = rmsg;
    if (rmsg.charAt(0) != "[") {
        let index = rmsg.indexOf("[");
        let head = rmsg.substr(0, index);
        msg = rmsg.substring(index);
        let sHead = getMD5(msg).substr(12, 8);
        if (sHead != head) {
            // if(getMD5(hex_str+kcpDelegate.__uid__+msg).substr(12,8) != head){
            console.log("waring get error data msg =", msg, "-->", rmsg);
            console.log("check head =", head, "-->", sHead);
            // kcpDelegate.send("room_out",Date.now());
            return;
        }
    }

    let data = JSON.parse(msg);
    //console.log("get message from client is " + msg);
    switch (data[0]) {

        case SERVER_CONST.ASSETS:
            //["assets",this.socket_id,this.roomModel.roomIndex,per]
            {
                let curRoom = roomManager.getRoom(data[2]);
                if (curRoom) {
                    curRoom.valid_uid(data[1]) && curRoom.broadcastAssetsPro(data[1], data[3]);
                } else {
                    console.log("can not find the room " + data[2]);
                }
            }
            break;
        case SERVER_CONST.ENTER: //玩家加入  第一次交流
            {
                // roomManager.newRoom(data[3],data[2]).addSock(data[1],kcpDelegate);
                let curRoom = roomManager.getRoom(data[2]);
                if (curRoom && curRoom.valid_uid(data[1])) {
                    kcpDelegate.rid = data[2];
                    curRoom.addSock(data[1], kcpDelegate);
                } else {
                    console.log("ENTER can not find the room " + data[2]);
                    kcpDelegate.send("room_out", Date.now());
                }
            }
            break;

        case SERVER_CONST.START:
            break;
        case SERVER_CONST.RE_CONN:
            { //this.socket_id,this.roomModel.roomIndex,this.roomModel.gameTimeLine.getCurrentFrame()
                let curRoom = roomManager.getRoom(data[2]);
                console.log("reconn rid = " + data.str());
                if (curRoom) {
                    if (curRoom.valid_uid(data[1])) {
                        kcpDelegate.rid = data[2];
                        curRoom.clientReConnection(data, kcpDelegate);
                    }
                } else {
                    let msg = roomManager.getFinishCmd(data[2]);
                    let ret_msg = msg ? msg : "room_out";
                    kcpDelegate.rejectRecoon(ret_msg);
                    console.log("RE_CONN can not find room " + data[2] + "  " + ret_msg);
                }

            }
            break;

        case SERVER_CONST.REDAY: //玩家准备好了
            {
                let curRoom = roomManager.getRoom(data[2]);
                if (curRoom) {
                    curRoom.valid_uid(data[1]) && curRoom.clientReady(data[1]);
                } else {
                    console.log("REDAY can not find the room " + data[2]);
                }
            }
            break;
        case SERVER_CONST.GAME_OVER: //战斗结束
            {
                let cur = roomManager.getRoom(data[1]);
                cur && cur.valid_uid(data[2]) && cur.finishSock(data[2]);

                // let cur = roomManager.getRoom(data[2]);
                // cur && cur.valid_uid(data[1]) && cur.finishSock(data[1]);//new modify

            }
            break;
        case SERVER_CONST.CLOSE: //关闭连接
            break;
        default: //房间广播信息
            {
                //console.log("other assets " + msg);
                let curRoom = roomManager.getRoom(data[0]);
                if (curRoom) {
                    curRoom.reciveActionsFromClient(data, kcpDelegate.__uid__);
                } else {
                    let msg = roomManager.getFinishCmd(data[0]);
                    let ret_msg = msg ? msg : "room_out";
                    kcpDelegate.rejectRecoon(ret_msg);
                    console.log("message can not find the room " + data[0] + " ,  " + ret_msg);
                }
            }
            break;
    }
}

module.exports.message = MessageHandler;
