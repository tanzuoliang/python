/**
 * @Author: wbsifan
 * @Date:   2017-03-13T14:10:56+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 15-Nov-2017
 */

const config = require("../tank-conf/dev.js");
const redis = new require("ioredis")(config.redisConfig);
const wee = require("weejs");
const locker = require("weejs/locker").create(redis);


var idx = 0;
async function test(i) {
    var name = "test-lock-" + i;
    var lock = await locker.lock(name);
    if (!lock) {
        console.log("lock error!!");
        return;
    }
    await wee.sleep(100);
    idx++;
    console.trace('Show me');
    console.log("doing:", idx);
    await lock.unlock(name);
}

for (let i = 0; i < 10; i++) {
    test(1);
}


// 未处理的异常
process.on('uncaughtException', function (err) {
    console.log('Unexpected exception stack: ' + err.stack)
});

// 未处理的 Promise异常
process.on('unhandledRejection', (reason, p) => {
    console.log("unhandledRejection", reason, p);
});