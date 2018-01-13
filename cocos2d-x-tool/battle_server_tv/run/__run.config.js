/**
 * @Author: wbsifan
 * @Date:   2017-05-26T11:09:54+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 2017-05-27T13:32:45+08:00
 */


// DEBUG模式开关
const DEBUG_MODE = "wee:*"; // wee:*   OR  false

// 进程启动数量
const TASK_NUM = 4;

// 支持的ENV环境
const ENV_LIST = ["t0", "t1", "t2", "t3"];

// KCP初始端口
const KCP_PORT = 41234;

const config = { apps: [] };

// 添加战斗进程
for (let i = 0; i < TASK_NUM; i++) {
    let name = "tank-battle-" + i;
    let kcpPort = KCP_PORT + i;
    // 添加进程
    config.apps.push({
        "name": name,
        "script": "main.js",
        "args": "",
        "node_args": "--harmony",
        "merge_logs": true,
        "watch": true,
        "ignore_watch": [
            "node_modules",
            "run",
            "conf"
        ],
        "log_date_format": "YYYY - MM - DD HH: mm Z",
        "env": {
            "KCP_PORT": kcpPort,
            "NODE_ENV": "dev",
            "DEBUG": DEBUG_MODE
        }
    });
}


// 添加环境变量
for (let app of config.apps) {
    for (let v of ENV_LIST) {
        app["env_" + v] = {
            "NODE_ENV": v
        }
    }
}


//require("fs").writeFileSync("./run/run.json", JSON.stringify(config, null, 4));

module.exports = config;
