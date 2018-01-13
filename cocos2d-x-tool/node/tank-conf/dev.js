/**
 * @Author: wbsifan
 * @Date:   2017-01-12T15:20:10+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 09-Nov-2017
 */

var config = {};


// DEBUG模式
config.debug = true;


// 服务器公网IP地址
config.publicAddress = "192.168.1.240";

// 加密字串
config.clientToken = "rUY0E18VxZla%Nk4Gq8oElKlttQlQ4eM";


// webSocket服务器配置
config.wsConfig = {
    "host": "0.0.0.0",
    "port": "9551"
};

// redis配置
config.redisConfig = {
    "host": "192.168.10.240",
    "port": "6379",
    "db": "2"
};

// 游戏SOAP地址 (内网)
config.gameSoapConfig = {
    url: "http://192.168.1.240:8000/soap.php",
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9"
};


module.exports = config;
