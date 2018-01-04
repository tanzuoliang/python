/**
 * @Author: wbsifan
 * @Date:   2017-03-09T20:05:59+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 20-Sep-2017
 */

"use strict";
const config = require("./config");
const util = require("util");
const wee = require("weejs");
const SoapClient = require("weejs/soap-client");

// 游戏服务器
const gameSoap = SoapClient.create(config.gameSoapConfig.url, config.gameSoapConfig.tokenKey);

/**
 * 战斗数据管理对象
 */
class DbBattle {


    /**
     * 战斗结束
     * @param  {[type]} roomId  房间ID
     * @param  {[type]} report  战斗结果OBJ
     * @param  {[type]} record  0:手动退出，不作数据统计   1:正常结算
     * @return Promise
     */
    async battleOver(roomId, report, record) {
        // 通知聊天服务器


        // 通知游戏服务器
        report = wee.jsonEncode(report);
        var res = await gameSoap.get("battle", "over", { roomId, report, record });
        if (res.err) {
            wee.error(res.err);
            return false;
        }

        return res;

    }

    async battleRevive(roomId, uid) {
        var res = await gameSoap.get("battle", "revive", { roomId, uid });
        console.log("battleRevive " + uid + " " + JSON.stringify(res));
        return res.data.res == 1;
    }

    async battleUseProp(roomId, uid, prop) {
        let d = { roomId, uid, prop };
        console.log("battleUseProp " + JSON.stringify(d));
        var res = await gameSoap.get("battle", "roomUseProp", d);
        // battleUseProp back is {"m":"battle","a":"roomUseProp","err":"","note":[],"data":{"res":1}}
        if (res.err) {
            wee.error(res.err);
            return false;
        }

        return true;
    }


    /**
     * 获取战斗数据
     * @param  {[type]} roomId
     * @return Promise
     */
    async getData(roomId) {
        var res = await gameSoap.get("battle", "getData", { roomId });
        if (res.err) {
            wee.error(res.err);
            return null;
        }
        return res.data;
    }
}


module.exports = new DbBattle();
