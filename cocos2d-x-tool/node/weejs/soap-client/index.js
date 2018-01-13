/**
 * @Author: wbsifan
 * @Date:   2017-01-18T14:32:38+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 10-Jun-2017
 */
"use strict";
const needle = require('needle');
const querystring = require("querystring");
const debug = require("debug")("wee:soap-client");
const wee = require("weejs");

const REQUEST_TIMEOUT = 5000;

/**
 * SoapClient
 */
module.exports = class Client {
    constructor(url, tokenKey) {
        this.url = url;
        this.tokenKey = tokenKey;
    }

    static create(url, tokenKey) {
        return new this(url, tokenKey);
    }

    async get(m, a, data) {
        var rtime = parseInt(new Date().getTime() / 1000);
        var param = JSON.stringify(data);
        var token = wee.md5([this.tokenKey, m, a, param, rtime].join(""), 8, 16);
        var postData = {
            m,
            a,
            param,
            token,
            rtime
        };
        var uri = this.url + "?" + querystring.stringify(postData);
        debug("soapClient Request:", uri);
        return this.httpGet(uri, true);
    }

    async httpGet(url, json = false) {
        var defer = wee.defer();
        var options = {
            open_timeout: REQUEST_TIMEOUT
        }
        needle.get(url, options, function(err, res, body) {
            if (err) {
                return defer.reject(err)
            }
            if (!body) {
                return defer.reject("reutn_data_error");
            }
            debug("BODY:", body.toString());
            if (json) {
                body = wee.jsonDecode(body);
            }
            defer.resolve(body);
        });
        return defer.promise;
    }
}
