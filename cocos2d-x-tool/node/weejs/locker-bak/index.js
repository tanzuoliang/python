/**
 * @Author: wbsifan
 * @Date:   2017-05-17T17:01:09+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 2017-05-23T10:10:00+08:00
 */

const util = require('util');
const crypto = require('crypto');

const RKEY_PREFIX = "locker";
const lockScript = 'return redis.call("set", KEYS[1], ARGV[1], "NX", "PX", ARGV[2])';
const unlockScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';


class Lock {
    constructor(locker, name, token, validity) {
        this.locker = locker;
        this.name = name;
        this.token = token;
        this.validity = validity;
    }

    async unlock() {
        var ret = await this.locker.unlock(this);
        return ret;
    }
}

class Locker {
    constructor(redis, retryDelay = 100, retryCount = 50) {
        this.redis = redis;
        this.retryDelay = retryDelay;
        this.retryCount = retryCount;
        this.clockDriftFactor = 0.01;
    }

    static create(redis, retryDelay = 100, retryCount = 10) {
        return new this(redis, retryDelay, retryCount);
    }

    async lock(name, ttl = 1000) {
        var token = this.makeToken();
        var ret = await this._lock(name, token, ttl);
        return ret;
    }


    async unlock(lock) {
        var ret = await this._unlock(lock.name, lock.token);
        return ret;
    }

    async _lock(name, token, ttl, n = 0) {
        n++;
        name = `${RKEY_PREFIX}:name`;
        var startTime = Date.now();
        var ret = await this.redis.set(name, token, "NX", "PX", ttl);
        var drift = Math.round(this.clockDriftFactor * ttl) + 2;
        var validity = ttl - (Date.now() - startTime) - drift;
        if (ret && validity > 0) {
            return new Lock(this, name, token, validity);
        } else {
            await this._unlock(name, token);
        }
        var delay = wee.rand(Math.floor(this.retryDelay / 2), this.retryDelay);
        await wee.sleep(delay);
        if (n < this.retryCount) {
            return await this._lock(name, token, ttl, n);
        } else {
            return false;
        }
    }

    async _unlock(name, token) {
        var ret = await this.redis.eval(unlockScript, 1, name, token);
        return ret;
    }

    makeToken() {
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = Locker;
