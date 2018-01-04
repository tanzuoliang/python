/**
 * @Author: wbsifan
 * @Date:   2017-04-14T10:12:35+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 17-Oct-2017
 */

// 创建Soap服务器
// wee.log("Start soap server at", config.soapConfig);
// const soapServer = require("weejs/soap-server").create(config.soapConfig);
// soapServer.setHandler("main", soapHandler);
// soapServer.listen();

// 加载配置文件
const config = require("./config");

// 创建https服务器
const https = require("https");
const http = require("http");
const fs = require('fs');
const options = {
    key: fs.readFileSync("./keys/server.key"),
    cert: fs.readFileSync("./keys/server.crt")
};

//
// const httpServer = https.createServer(options, (req, res) => {
//     res.end("https:hello world");
// }).listen(config.wsConfig);

const httpServer = http.createServer((req, res) => {
    res.end("http:hello world!");
}).listen(config.wsConfig);


// 创建WS服务器
wee.log("Start ws server at", config.wsConfig);
const WebSocketServer = require('ws').Server;
const wsServer = new WebSocketServer({ server: httpServer });
const chatHandler = require("./chat-handler");

wsServer.on('connection', async(ws) => {
    // 连接关闭
    ws.on('close', async() => {
        try {
            chatHandler.execClose(ws);
        } catch (err) {
            wee.error(err);
        }

    });
    ws.on("message", async(data) => {
        //debug("onmessage:", data);
        try {
            await chatHandler.execClient(ws, data);
        } catch (err) {
            wee.error(err);
        }
    });

    // 开始连接
    chatHandler.execOpen(ws);
});
