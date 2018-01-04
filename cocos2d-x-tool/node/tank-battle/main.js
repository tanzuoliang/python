
/**
 * @Author: wbsifan
 * @Date:   2017-03-27T19:05:16+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 22-Sep-2017
 */

'use strict';

// ***** ==== add start ==== ***** //

// 加载核心框架
const wee = require("weejs");

// 加载配置文件
const manage = require("./lib/manage");

// 监听战斗开始事件 前端传 roomId, uid, key 验证 uid 和 key 是否在此房间中
manage.onStart((battleInfo) => {

    // todo 创建房间
    console.log("Start Battle at ", Object.keys(battleInfo));
    require("./room").RoomManager.onRoomData(battleInfo);
});

// ***** ==== add end ==== ***** //


const server = require('dgram').createSocket('udp4');
const kcpManager = require("./kcpManager").KCPManager;
const MESSAGE_HANDLER = require("./message").message;

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});



server.on('message', (msg, rinfo) => {
    let kcpDelegate = kcpManager.getOrCreateKCPDelegate(rinfo.address + ':' + rinfo.port, rinfo, server, msg);
    if (kcpDelegate) {
        kcpDelegate.input(msg);
        MESSAGE_HANDLER(kcpDelegate.recv(), kcpDelegate);
    }
});


server.on('listening', () => {
    var address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);

    kcpManager.startup(server);
});

server.bind(manage.port);
