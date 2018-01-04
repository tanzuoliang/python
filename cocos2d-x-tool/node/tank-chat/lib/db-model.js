/**
 * @Author: wbsifan
 * @Date:   2017-02-28T17:29:17+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 17-Oct-2017
 */
"use strict";
// 加载配置文件
const config = require("./config");
const RedisClient = require("ioredis");
const redis = new RedisClient(config.redisConfig);
const util = require("util");
const wee = require("weejs");
const SoapClient = require("weejs/soap-client");

/**
 * UserModel
 */
class DbModel {
    /**
     * Creates an instance of DbModel.
     * @param {any} config
     */
    constructor() {
        this.gameSoap = SoapClient.create(config.gameSoapConfig.url, config.gameSoapConfig.tokenKey);
    }

    /**
     * 使用喇叭
     * 
     * @param {any} uid 
     * @returns 
     * @memberof DbModel
     */
    async useHorn(uid) {
        var res = await this.gameSoap.get("Chat", "useHorn", {uid});
        if (res.err) {
            wee.error(res.err);
            return null;
        }
        return res.data;
    }

    /**
     * 获取玩家信息e
     * @param {any} uid
     * @returns
     */
    async getUserInfo(uid) {
        var res = await this.gameSoap.get("Chat", "getUserInfo", { uid });
        if (res.err) {
            wee.error(res.err);
            return null;
        }
        return res.data;
    }

    async getRoomState(type, uid) {
        var res = await this.gameSoap.get("Room", "getState", { type, uid });
        if (res.err) {
            wee.error(res.err);
            return null;
        }
        return res.data;
    }

    async roomStart(roomId) {
        var res = await this.gameSoap.get("Room", "start", { roomId });
        if (res.err) {
            wee.error(res.err);
            return null;
        }
        return res.data;
    }


    async roomChangeInfo(roomId, info) {
        // info : {type:1, typeId:xxx}
        var res = await this.gameSoap.get("Room", "changeInfo", info);
        if (res.err) {
            wee.error(res.err);
            return null;
        }
        return true;
    }

    async getAiList(num, teamUids) {
        var res = await this.gameSoap.get("Room", "getAiList", { num, teamUids });
        if (res.err) {
            wee.error(res.err);
            return null;
        }
        return res.data;
    }
}


module.exports = new DbModel();
