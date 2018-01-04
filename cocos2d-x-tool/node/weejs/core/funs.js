/**
 * @Author: wbsifan
 * @Date:   2017-01-14T13:46:48+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 29-Sep-2017
 */



/**
 * Created by wbsifan on 2016/12/16.
 */
"use strict";
const util = require("util");
const fs = require("fs");
const crypto = require('crypto');
const colors = require('colors');
const debug = require("debug")("wee:debug");

// exit事件数量
var exitEventCount = 0;

module.exports = class Funs {

    /**
     * 监听退出事件
     * @param  {Function} cb
     * @return {[type]}
     */
    static onExit(cb) {
        exitEventCount++;
        var done = (timeout = 10) => {
            exitEventCount--;
            if (exitEventCount == 0) {
                setTimeout(process.exit, timeout);
            }
        };
        process.on('SIGTERM', () => {
            cb(done);
        });
        process.on('SIGINT', () => {
            cb(done);
        });
    }

    static dump(...args) {
        console.log("Start dump @\n", JSON.stringify(args, null, 2), "\n@End");
    }

    static log(...args) {
        console.log("wee:log".green, "[", new Date().toLocaleString(), "]", ...args);
    }

    static error(...args) {
        console.error("wee:error".green, "[", new Date().toLocaleString(), "]", ...args);
    }

    static throwError(err) {
        throw new Error(err);
    }


    /**-----------------------------------------*
     *
     * var
     *
     *------------------------------------------*/
    static isset(obj) {
        return util.isNullOrUndefined(obj);
    }


    /**
     * 判断一个对像是否为空
     * @param {[type]} obj [description]
     * @return {[type]} [description]
     */
    static empty(obj) {
        if (Funs.isObject(obj)) {
            return Object.keys(obj).length === 0;
        } else if (Funs.isArray(obj)) {
            return obj.length === 0;
        } else if (!obj) {
            return true;
        }
        return false;
    }


    /**-----------------------------------------*
     *
     * promise
     *
     *------------------------------------------*/

    /**
     * get deferred object
     * @return {Object} []
     */
    static defer() {
        var deferred = {};
        deferred.promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        return deferred;
    };


    /**
     * 等待多少ms
     * @param  {[type]} mt
     * @return {[type]}
     */
    static async sleep(mt) {
        var d = Funs.defer();
        setTimeout(() => {
            d.resolve();
        }, mt);
        return d.promise;
    }



    /**
     * 将内容写入文件
     * @param  {[type]} file
     * @param  {[type]} value
     * @return {[type]}
     */
    static writeFile(file, value) {
        fs.writeFileSync(file, value);
    }

    /**
     * 读取文件
     * @param  {[type]} file
     * @param  {[type]} [opt=null]
     * @return {[type]}
     */
    static readFile(file, opt = null) {
        return fs.readFileSync(file, opt);
    }


    /**-----------------------------------------*
     *
     * string & JSON
     *
     *------------------------------------------*/

    /**
     * jsonEncode
     * @param  {[type]} arg
     * @param  {[type]} [space=null]
     * @return {[type]}
     */
    static jsonEncode(arg, space = null) {
        try {
            var ret = JSON.stringify(arg, null, space);
            return ret;
        } catch (err) {
            return null;
        }
    }

    /**
     * jsonDecode
     * @param  {[type]} arg
     * @return {[type]}
     */
    static jsonDecode(arg) {
        try {
            var ret = JSON.parse(arg);
            return ret;
        } catch (err) {
            return null;
        }
    }

    /**
     * MD5加密
     * @param str
     * @param start
     * @param length
     * @returns {string|*}
     */
    static md5(str, start = 0, length = 0) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(str);
        str = md5sum.digest('hex');
        if (start && length) {
            str = str.substr(start, length);
        }
        return str;
    };

    /**
     * 生成唯一ID
     * @param  {Number} [num=8]
     * @return {[type]}
     */
    static uniqid(num = 8) {
        return crypto.randomBytes(num).toString('hex');
    }



    /**
     * RC-4|XOR加密算法
     * @param  {[type]} data    要加密的字符串
     * @param  {[type]} key     加密KEY值
     * @return {[type]}
     */
    static rc4(data, key) {
        var keys = [];
        var boxs = [];
        var cipher = [];
        for (let i = 0, j = 0; i < 256; i++) {
            keys[i] = key.charCodeAt(i % key.length);
            boxs[i] = i;
        }
        for (let i = 0, j = 0; i < 256; i++) {
            j = (j + boxs[i] + keys[i]) % 256;
            var tmp = boxs[i];
            boxs[i] = boxs[j];
            boxs[j] = tmp;
        }
        for (let a = 0, i = 0, j = 0; i < data.length; i++) {
            a = (a + 1) % 256;
            j = (j + boxs[a]) % 256;
            var tmp = boxs[a];
            boxs[a] = boxs[j];
            boxs[j] = tmp;
            var k = boxs[((boxs[a] + boxs[j]) % 256)];
            cipher[i] = String.fromCharCode(data.charCodeAt(i) ^ k);
        }
        return cipher.join("");
    }


    /**
     * 返回随机数
     * @param min
     * @param max
     * @returns {number}
     */
    static rand(min, max = 0) {
        if (!max) {
            max = min;
            min = 0;
        }
        max++;
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**
     * 格式化日期
     * @param fmt
     * @param date
     * @returns {string}
     */
    static dateFormat(fmt = "yy-MM-dd hh:mm:ss", date = new Date()) {
        var o = {
            "M+": date.getMonth() + 1, //月份
            "d+": date.getDate(), //日
            "h+": date.getHours(), //小时
            "m+": date.getMinutes(), //分
            "s+": date.getSeconds(), //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds() //毫秒
        };

        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (date.getFullYear().toString()).substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    /**
     * 秒级的时间缀
     * @return {[type]}
     */
    static time() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * 毫秒级时间缀
     * @return {[type]}
     */
    static mtime() {
        return Date.now();
    }


    /**
     * 随机获取一个数组的元素
     * @param arr
     * @returns {*}
     */
    static arrayRand(arr) {
        var len = arr.length;
        if (len == 0) {
            return null;
        }
        var index = Funs.rand(len - 1);
        return arr[index];
    }

    /**
     * arrayCombine
     * @param  {[type]} keys
     * @param  {[type]} values
     * @return {[type]}
     */
    static arrayCombine(keys, values, fiter) {
        var obj = {};
        for (let k of keys) {
            if (fiter) {
                obj[k] = fiter(values[k]);
            } else {
                obj[k] = values[k];
            }
        }
        return obj;
    }


    /**-----------------------------------------*
     *
     * object
     *
     *------------------------------------------*/

    /**
     * 统计一个对象长度
     * @param  {[type]} obj
     * @return {[type]}
     */
    static count(obj) {
        return Object.keys(obj).length;
    }


    /**
     * Map ==> JSON
     * @param  {[type]} map
     * @return {[type]}
     */
    static mapToJson(map) {
        return JSON.stringify([...map]);
    }

    /**
     * Json ==> Map
     * @param  {[type]} jsonStr
     * @return {[type]}
     */
    static jsonToMap(jsonStr) {
        return new Map(JSON.parse(jsonStr));
    }

    static isArray(arg) {
        return Array.isArray(arg);
    }

    static isBuffer(arg) {
        return Buffer.isBuffer(arg);
    }

    static isBoolean(arg) {
        return typeof arg === 'boolean';
    }

    static isNull(arg) {
        return arg === null;
    }


    static isNullOrUndefined(arg) {
        return arg === null || arg === undefined;
    }

    static isNumber(arg) {
        return typeof arg === 'number';
    }


    static isString(arg) {
        return typeof arg === 'string';
    }


    static isSymbol(arg) {
        return typeof arg === 'symbol';
    }


    static isUndefined(arg) {
        return arg === undefined;
    }


    static isRegExp(re) {
        return binding.isRegExp(re);
    }

    static isObject(arg) {
        return arg !== null && typeof arg === 'object';
    }

    static isFunction(arg) {
        return typeof arg === 'function';
    }

    static isPrimitive(arg) {
        return arg === null ||
            typeof arg !== 'object' && typeof arg !== 'function';
    }

}
