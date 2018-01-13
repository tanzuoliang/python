/**
 * @Author: wbsifan
 * @Date:   2017-01-12T15:20:10+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 10-Nov-2017
 */

var config = {};

// 服务器公网IP地址
config.publicAddress = "111.231.113.26";

// 加密字串
config.clientToken = "rUY0E18VxZla%Nk4Gq8oElKlttQlQ4eM";

// webSocket服务器配置
config.wsConfig = {
    "host": "0.0.0.0",
    "port": "9551"
};

// redis配置
config.redisConfig = {
    "host": "10.66.206.26",
    "port": "6379",
    "db": "2",
    "password": "CJkrPnXdi4uefQVH"
};

// 游戏SOAP服务器
config.gameSoapConfig = {
    url: "http://10.105.92.100:80/soap.php",
    tokenKey: "ELGP6F6RN7MOHQ259OALYT915Q6TH9"
};

module.exports = config;
