/**
 * @Author: wbsifan
 * @Date:   2017-03-13T13:58:29+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 2017-04-16T13:06:35+08:00
 */

const mysql = require("mysql2");

class DbMysql {
    // "host": "192.168.1.240",
    // "port": 3306,
    // "user": "tank",
    // "password": "tank",
    // "database": "tank_main"
    constructor(conf) {
        this.config = conf;
        this.connect();
    }

    connect() {
        this.conn = mysql.createConnection(this.config);
        this.conn.connect((err) => {
            this.errorHandler(err);
        });
        this.conn.on("error", (err) => {
            this.errorHandler(err);
        });
    }

    errorHandler(err) {
        if (err) {
            if (err.code == 'PROTOCOL_CONNECTION_LOST') {
                this.connect();
            } else {
                wee.error("wee:mysql-error", err);
            }
        }
    }

    async getOne(sql) {
        var res = await this.query(sql);
        if (res[0]) {
            return res[0];
        }
        return null;
    }

    async getAll(sql, asKey = null) {
        var res = await this.query(sql);
        if (asKey) {
            var list = {};
            for (let v of res) {
                list[v[asKey]] = v;
            }
        } else {
            list = res;
        }
        return list;
    }

    async query(sql) {
        var defer = wee.defer();
        this.conn.query(sql, (err, rows, fields) => {
            if (err) {
                defer.reject(err);
            }
            defer.resolve(rows);
        });
        return defer.promise;
    }

}

var dbList = new Map();

function create(dbIndex, newConn = false) {
    var conf = config[dbIndex];
    if (!conf) {
        throw new Error(`db tag [${dbIndex}] not exists `);
    }
    if (newConn) {
        return new DbMysql(conf);
    }
    if (!dbList.has(dbIndex)) {
        dbList.set(dbIndex, new DbMysql(conf));
    }
    return dbList.get(dbIndex);
}

module.exports = { create, DbMysql }
