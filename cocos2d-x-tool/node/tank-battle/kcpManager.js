/**
 * @Author: wbsifan
 * @Date:   20-Sep-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 24-Oct-2017
 */



'use strict'

//var KCP = require("/usr/local/lib/node_modules/node-kcp/build/Release/kcp").KCP;//local
var KCP = require("node-kcp").KCP; //server
var MESSAGE_HANDLER = require("./message").message;
const SERVER_CONST = require("./const").SERVER_CONST;

const getFromMap = require("./utils").getFromMap;

// KCP更新时间间隔
const KCP_UPDATE_TIME = 10;
// 内部工作检查的时间
const KCP_INTER_TIME = 10;


function out_put(data, size, context) {
    context.server.send(data, 0, size, context.port, context.address);
    //console.log("send message to " + context.address + ":" + context.port + ":" + data + ",size = " + size);
}

class KCPDelegate {
    constructor(key, tag, data, cmd) {
        this.kcp = new KCP(tag, data);
        this.kcpContext = data;
        this.key = key;

        this.kcp.nodelay(1, KCP_INTER_TIME, 2, 1);
        this.kcp.wndsize(SERVER_CONST.KCP_SIZE, SERVER_CONST.KCP_SIZE);
        this.kcp.output(out_put);
        this.rid = -1;
        /**
         * 窗口数据是否满了
         * @type {boolean}
         */
        this.is_off_line = false;
        /**
         * 最后一次收到数据的时间
         * @type {number}
         */
        this.lastInputTime = 0;

        this.updateCount = 0;

        /**
         * 上一个发送的时间
         * @type {number}
         */
        this.lastSendTime = 0;

        this.removeSelfNextUpdate = false;
        // console.log("create kcp " + key + " , command = " + cmd);
        // if(cmd.indexOf("gameOver") != -1){
        // 	this.removeSelfNextUpdate = true;
        // }

        this.isReady = false;
        this.timeout_id = -1;


        this.__uid__ = 0;

        /**
         * 是否已经拒绝重连
         * @type {boolean}
         */
        this.hasRejectReconn = false;

        this.initTime = Date.now();
    }

    bindUID(uid) {
        this.__uid__ = uid;
    }

    // clientInfo(){
    // 	return this.kcpContext.address + ":" + this.kcpContext.port;
    // }

    input(msg) {
        this.kcp && this.kcp.input(msg);
    }

    recv() {
        if(this.kcp){
            let msg = this.kcp.recv();
            return msg ? msg.toString() : null;
        }
        return null;
    }

    update(t) {
        // ++this.updateCount > 1500 &&
        //     // (this.lastSendTime == 0 || (t - this.lastSendTime) > 1500) &&
        //     (this.lastSendTime > 0 && (t - this.lastSendTime) > 15000) &&
        //     !manager.deleteKcp(this.key, this.rid, "kcp update no send message more than ten second") || this.kcp.update(t);

        this.updateCount++;
        if(this.updateCount > 500 && this.lastSendTime > 0 && (t - this.lastSendTime) > 5000){
            manager.deleteKcp(this.key, this.rid, "kcp update no send message more than ten second");
        }
        else{
            this.kcp && this.kcp.update(t);
        }
    }

    send(msg, now) {
        if (!this.hasRejectReconn && this.kcp) {
            this.kcp.send(msg);
            this.kcp.flush();
        }
        this.lastSendTime = now;
    }

    offline() {
        if(this.kcp){
            return this.is_off_line = this.kcp.waitsnd() > SERVER_CONST.KCP_SIZE * 0.5;
        }
        return false;
    }

    release() {
        //this.kcp.release();
        this.kcp = null;
    }

    /**
     * 拒绝重联 战半斗结束，房间已经释放
     * this.socket_id,this.roomModel.roomIndex,this.roomModel.gameTimeLine.getCurrentFrame()
     */
    rejectRecoon(cmd) {
        if (!this.hasRejectReconn) {
            console.log("send reject recoon cmd = " + cmd);
            let t = Date.now();
            this.send(new Buffer(cmd), t);
            this.kcp.update(Date.now(), t);
            this.hasRejectReconn = true;
        }
        //this.kcpContext.server.send("", 0, 6, this.kcpContext.port, this.kcpContext.address);
    }
}


class KCPManager {

    constructor() {
        this.kcpMap = new Map();

        this.closeKcpMap = new Set();

        this.roomCloseKcp = new Map();
    }

    getOrCreateKCPDelegate(key, rinfo, server, cmd) {
        return this.closeKcpMap.has(key) ? null : getFromMap(this.kcpMap, key, () => new KCPDelegate(key, 123, { address: rinfo.address, port: rinfo.port, server: server }, cmd));
    }

    deleteKcp(key, rid, reason) {
        let delegate = this.kcpMap.get(key);
        if (delegate) {
            this.kcpMap.delete(key);
            delegate.release();
            if(rid != -1){
                this.closeKcpMap.add(key);
                getFromMap(this.roomCloseKcp, rid, () => []).push(key);
            }

            //console.log("remove kcp " + key + " successfully reason = " + reason);
        } else {
            //console.log("remove kcp " + key + " fail  reason = " + reason);
        }
    }

    roomOut(rid) {
        /**
         *
         */
        setTimeout(() => {
            console.log("--------- roomOut " + Date.now());
            let list = this.roomCloseKcp.get(rid);
            if (list) {
                for (let key of list) {
                    this.closeKcpMap.delete(key);
                }

                this.roomCloseKcp.delete(rid);
            }
        }, 15000);
    }


    update(time) {
        for (let [_, delegate] of this.kcpMap) {
            delegate.update(time);
            MESSAGE_HANDLER(delegate.recv(), delegate);
        }
    }


    startup(server) {
        this.server = server;
        setInterval(() => {
            this.update(Date.now());
        }, KCP_UPDATE_TIME);

        setInterval(() => {
            //console.log("check-num", "kcpMap=", this.kcpMap.size, "roomCloseKcp=", this.roomCloseKcp.size, "closeKcpMap=", this.closeKcpMap.size);
        }, 10000);


        /**
         * 强制清理下KCP(一分钟一次  KCP存留时间超过200秒强制结束)
         */
        setInterval(()=>{
            let n = Date.now();
            let ret = [];
            for(let [key,del] of this.kcpMap){
                if((n - del.initTime) > 200000){
                    ret[ret.length] = key;
                }
            }

            if(ret.length > 0){
                for(let key of ret){
                    let delegate = this.kcpMap.get(key);
                    if (delegate) {
                        this.kcpMap.delete(key);
                        delegate.release();
                        console.log("force remove kcp " + key + " successfully");
                    } else {
                        console.log("force remove kcp " + key + " fail  reason");
                    }
                }
            }

        },60000);
    }
}

let manager = new KCPManager();

module.exports.KCPManager = manager;
