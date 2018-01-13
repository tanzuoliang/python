/**
 * @Author: wbsifan
 * @Date:   2017-01-12T15:20:10+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 21-Aug-2017
 */

var config = {};


// 服务器公网IP地址
config.publicAddress = "192.168.1.240";

// 加密字串
config.clientToken = "rUY0E18VxZla%Nk4Gq8oElKlttQlQ4eM";

// KCP服务器端口列表
config.kcpConfig = {
    host: "0.0.0.0",
    port: [41234, 41235, 41236, 41237, 41238, 41239, 41240, 41241]
}

// soap服务器配置
config.soapConfig = {
    host: "0.0.0.0",
    port: 9550,
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9"
};

// webSocket服务器配置
config.wsConfig = {
    "host": "0.0.0.0",
    "port": "9551"
};

// redis配置
config.redisConfig = {
    "host": "192.168.1.240",
    "port": "6379",
    "db": "2"
};

// 游戏SOAP地址 (内网)
config.gameSoapConfig = {
    url: "http://192.168.1.240:8000/soap.php",
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9"
};

// 聊天服务器soap地址 (内网)
config.chatSoapConfig = {
    url: "http://192.168.1.240:9550",
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9",
}

module.exports = config;
