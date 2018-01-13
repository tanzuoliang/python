/**
 * @Author: wbsifan
 * @Date:   20-Sep-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 20-Sep-2017
 */

// 初始化配置
const config = require("weejs/config").create();

// 调试模式
config.debug = false;


// 配置文件标识
const NODE_ENV = process.env.NODE_ENV || "dev";

// 更新服务器配置
const servOpt = require(`../conf/${NODE_ENV}.js`);

config.set(servOpt);

module.exports = config;
