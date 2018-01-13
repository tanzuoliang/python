'use strict'

const SERVER_CONST = require("./const.js").SERVER_CONST;
const MY_DATA = require("./utils").MY_DATA;

/**
 * 多少帧一心跳
 * @type {number}
 */
const MAX_KEEP_ALIVE_NUM = 20;

const KEEP_ALIVE = new Buffer("keepAlive");

/**
 * 客户端
 */
class SockClient{
	constructor(id,kcpDelegate,room){
		this.id = id;
		this.rid = room.rid;
		this.kcpDelegate = kcpDelegate;
		this.room = room;
		this.enable = true;
		this.isReady=  false;

		this.flag = 0;
		this.keep_alive_num = 0;

		kcpDelegate.bindUID(id);
	};

	sendKeepAlive(now){
		this.keep_alive_num++;
		if(this.keep_alive_num > MAX_KEEP_ALIVE_NUM){
			this.keep_alive_num = 0;
			this.send(KEEP_ALIVE,now);
		}
	}

	readyFight(){
		this.isReady = true;
		this.kcpDelegate.isReady = true;
	}

	lock(){
		this.flag = 1;
		console.log("lock the sock ");
	}

	send(msg,now){
		// if(this.flag == 2){
		// 	console.log("ingore send message " + msg);
		// 	return;
		// }
		// if(this.flag == 1)
		// 	this.flag == 2;
		if(!this.enable){
			console.log(this.rid + ":" + this.id + " waiting for delete ignore " + msg);
			this.room.removeSock(this.id,"offline",true)
			return;
		}
		if(this.kcpDelegate.offline()){
			console.log(`${this.id} : ${this.kcpDelegate.key} - max_waitsnd ignore message is ${msg}`);
			this.kcpDelegate.send("cls1",now);
			// process.nextTick(()=>this.room.removeSock(this.id,"offline",true));
			//setTimeout(()=>this.room.removeSock(this.id),SERVER_CONST.SERVER_COMMAND_TIME * 10);
			this.enable = false;
			return;
		}
		this.kcpDelegate.send(msg,now);
		this.keep_alive_num = 0;
	};

	sendReCoon(msg,now){
		this.send(msg,now);
		//console.log("send recoonData to " + this.id + ":\n" + msg);
	}

	dispose(){
		this.kcpDelegate = null;
	}
}

module.exports.Sock = SockClient;

