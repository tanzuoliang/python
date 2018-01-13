/**
 * @Author: wbsifan
 * @Date:   2017-03-09T17:21:29+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 20-Sep-2017
 */


/**
 * Created by wbsifan on 2017/1/9. 1111
 */
'use strict';

const wee = require('./core/funs');

// 核心路径
wee.path = __dirname;


global.wee = wee;

module.exports = wee;

// 未处理的异常
process.on('uncaughtException', function(err) {
    wee.error('Unexpected exception stack: ' + err.stack)
});

// 未处理的 Promise异常
process.on('unhandledRejection', (reason, p) => {
    wee.error("unhandledRejection", reason, p);
});
