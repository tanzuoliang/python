/**
 * @Author: wbsifan
 * @Date:   2017-05-03T09:43:00+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 15-Sep-2017
 */

const wee = require("weejs");
const RedisClient = require("ioredis");
const debug = require("debug")("wee:remote");
const ip = require("ip");

// RemoteKEY前缀
const REMOTE_PREFIX = "remote";
// 最大的请求ID
const MAX_EVENTID = 16000000;
// 进程状态更新时间 s
const STATE_UPDATE_TIME = 10;
// 状态过基时间 s
const STATE_EXPIRE_TIME = 15;

// RPC请求名
const RPC_NAME = "#RPC#";
// RPC确认返回名
const RPC_ACKNAME = "#RPCACK#";


class Remote {
    constructor(nsp = "/", remoteId = null) {
        this.nsp = nsp;
        this.remoteId = remoteId || [ip.address(), process.pid].join("/");
        this.channel = `${this.nsp}:${this.remoteId}`;
        this.rkey = `${REMOTE_PREFIX}:${this.channel}`;
        this.events = {};
        this.eventId = 0;
    }

    /**
     * [create description]
     * @param  {[type]} config
     * @return {Remote}
     */
    static create(config, nsp = "/", remoteId = null) {
        var obj = new this(nsp, remoteId);
        obj.connect(config);
        return obj;
    }

    /**
     * 连接服务器
     * @param  {[type]} config
     * @return {Promise}
     */
    async connect(config) {
        this.pubRedis = config.pubRedis || new RedisClient(config);
        this.subRedis = config.subRedis || new RedisClient(config);
        this.subRedis.on("message", (channel, packet) => {
            if (this.channel == channel || this.nsp == channel) {
                this._onMessage(packet);
            }
        });
        this.subRedis.subscribe([this.channel, this.nsp], async(err, count) => {
            if (err) {
                throw Error(err);
            }
            debug("Start subscribe on:", [this.channel, this.nsp], count);
            await this.pubRedis.setex(this.rkey, STATE_EXPIRE_TIME, this.channel);
            setInterval(() => {
                this.pubRedis.setex(this.rkey, STATE_EXPIRE_TIME, this.channel);
            }, STATE_UPDATE_TIME * 1000);
        });
        wee.onExit(async(done) => {
            debug("End subscribe at:", this.channel);
            await this.pubRedis.del(this.rkey);
            done();
        });
    }




    /**
     * 切换命名空间
     * @param  {String} [nsp="/"]
     * @return {[type]}
     */
    use(nsp = "/") {
        return Remote.create({ pubRedis: this.pubRedis, subRedis: this.subRedis }, nsp);
    }

    /**
     * 移除监听事件
     * @param  {[type]} name
     * @return {[type]}
     */
    remove(name) {
        delete this.events[name];
    }

    /**
     * 监听事件
     * @param  {[type]} name
     * @param  {Function} cb
     * @return {[type]}
     */
    on(name, cb) {
        this.events[name] = cb;
    }


    /**
     * 向所有检听者发送消息
     * @param  {[type]} name
     * @param  {[type]} cmd
     * @param  {[type]} data
     * @return {Promise}
     */
    async emit(name, ...data) {
        var channel = this.channel;
        await this._publish(channel, name, ...data);
    }

    /**
     * 向指定nsp发送消息
     * @param  {[type]} nsp
     * @param  {[type]} name
     * @param  {[type]} data
     * @return {Promise}
     */
    async emitTo(channel, name, ...data) {
        await this._publish(channel, name, ...data);
    };

    /**
     * 获取子空间列表
     * @param  {[type]} nsp
     * @return {Promise}
     */
    async getChildList(nsp = null) {
        nsp = nsp || this.nsp;
        var rkey = `${REMOTE_PREFIX}:${nsp}:*`;
        var keys = await this.pubRedis.keys(rkey);
        if (!wee.empty(keys)) {
            var ret = await this.pubRedis.mget(keys);
        } else {
            var ret = [];
        }
        return ret;
    }

    /**
     * 随机获取一个子空间
     * @param  {[type]} nsp
     * @return {Promise}
     */
    async getChildRand(nsp = null) {
        var list = await this.getChildList(nsp);
        var ret = wee.arrayRand(list);
        return ret;
    }

    async invoke(m, a, args, cb) {

    }

    async _publish(channel, name, ...data) {
        this.eventId++;
        if (this.eventId > MAX_EVENTID) {
            this.eventId = 1;
        }
        var id = [name, wee.uniqid(8), wee.rand(1000, 9999)].join("-");
        var packet = {
            id: id,
            from: this.channel,
            name: name,
            data: data
        };
        debug("publish:", channel, wee.jsonEncode(packet));
        await this.pubRedis.publish(channel, wee.jsonEncode(packet));
    }

    /**
     * 收到消息
     * @param  {[type]} packet
     * @return {[type]}
     */
    _onMessage(packet) {
        debug("onMessage @", this.channel, packet);
        packet = wee.jsonDecode(packet);
        if (!packet) {
            wee.error("packet_data_error");
            return;
        }
        var { name, data } = packet;
        var cb = this.events[name];
        if (cb) {
            // var fn = (name, ...data) => {
            //     var channel = `${REMOTE_PREFIX}:${packet.from}`;
            //     this._publish(channel, name, ...data);
            // }
            // cb(...data, fn);
            cb(...data);
        }
    }

    async startServer(router) {

    }
}

module.exports = Remote;
