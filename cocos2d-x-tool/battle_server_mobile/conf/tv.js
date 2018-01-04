/**
 * @Author: wbsifan
 * @Date:   2017-01-12T15:20:10+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 28-Aug-2017
 */

var config = {};

// 服务器公网IP地址
config.publicAddress = "182.254.155.127";

// 加密字串
config.clientToken = "rUY0E18VxZla%Nk4Gq8oElKlttQlQ4eM";


// soap服务器配置
config.soapConfig = {
    host: "0.0.0.0",
    port: 9560,
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9"
};

// webSocket服务器配置
config.wsConfig = {
    "host": "0.0.0.0",
    "port": "9561"
};

// redis配置
config.redisConfig = {
    "host": "127.0.0.1",
    "port": "6373",
    "db": "2"
};

// 游戏SOAP服务器
config.gameSoapConfig = {
    url: "http://127.0.0.1:8001/soap.php",
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9"
};

// 聊天服务器soap地址
config.chatSoapConfig = {
    url: "http://127.0.0.1:9560",
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9"
}

module.exports = config;
