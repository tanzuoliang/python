/**
 * @Author: wbsifan
 * @Date:   10-Jun-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 20-Sep-2017
 */


class Config {
    constructor(opt = {}) {
        this.debugMode = false;
        this.set(opt);
    }

    static create(opt = {}) {
        return new this(opt);
    }

    /**
     * 更新配置
     * @param {[type]} opt
     */
    set(opt) {
        Object.assign(this, opt);
        return this;
    }

    /**
     * 获取配置
     * @param  {[type]} name
     * @return {[type]}
     */
    get(name) {
        return this[name];
    }
}

module.exports = Config;
