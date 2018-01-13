/**
 * @Author: wbsifan
 * @Date:   18-Sep-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 20-Sep-2017
 */


const url = "ws://192.168.1.240:9551";

const WebSocket = require('ws');

const ws = new WebSocket(url);

ws.on('open', function open() {
    ws.send('something');
});

ws.on('message', function incoming(data) {
    console.log(data);
});
