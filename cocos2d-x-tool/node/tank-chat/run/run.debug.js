/**
 * @Author: wbsifan
 * @Date:   2017-05-26T11:09:54+08:00
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 19-Oct-2017
 */

// 运行环境标识
const commander = require('commander');
commander.version('1.0')
    .option('-e, --env [tag]', 'Select the server tag')
    .parse(process.argv);
const NODE_ENV = commander.env || "dev";
const config = { apps: [] };

// 本机进程数量
const TASK_NUM = 1;
const DEBUG_MODE = "wee:*";

// 添加进程
config.apps.push({
    // 进程名
    name: ["tank-chat", NODE_ENV].join(":"),
    // 脚本运行目录
    cwd: "./",
    // 要执行的脚本名称
    script: "chat.js",
    // 要传递给脚本的参数  例如 m=1 a=2
    args: "",
    // 进程数量
    instances: TASK_NUM,
    // FORK新进程 PHP等其它脚本必须用fork
    //exec_mode: "fork",
    // 进程集群 仅NODE环境支持
    exec_mode: "cluster",
    // node参数 仅NODE环境支持
    node_args: "--harmony",
    // 是否合并所有进程的日志
    merge_logs: true,
    // 是否监控文件变动
    watch: false,
    // 不监控的文件夹
    ignore_watch: [
        "node_modules"
    ],
    log_date_format: "YYYY - MM - DD HH: mm Z",
    env: {
        // 环境变量
        "NODE_ENV": NODE_ENV,
        // DEBUG MODE
        "DEBUG": DEBUG_MODE
    }
});


// 添加进程
config.apps.push({
    // 进程名
    name: ["tank-match", NODE_ENV].join(":"),
    // 脚本运行目录
    cwd: "./",
    // 要执行的脚本名称
    script: "match.js",
    // 要传递给脚本的参数  例如 m=1 a=2
    args: "",
    // 进程数量
    instances: 1,
    // FORK新进程 PHP等其它脚本必须用fork
    //exec_mode: "fork",
    // 进程集群 仅NODE环境支持
    exec_mode: "cluster",
    // node参数 仅NODE环境支持
    node_args: "--harmony",
    // 是否合并所有进程的日志
    merge_logs: true,
    // 是否监控文件变动
    watch: false,
    // 不监控的文件夹
    ignore_watch: [
        "node_modules"
    ],
    log_date_format: "YYYY - MM - DD HH: mm Z",
    env: {
        // 环境变量
        "NODE_ENV": NODE_ENV,
        // DEBUG MODE
        "DEBUG": DEBUG_MODE
    }
});


// 添加进程
config.apps.push({
    // 进程名
    name: ["tank-room", NODE_ENV].join(":"),
    // 脚本运行目录
    cwd: "./",
    // 要执行的脚本名称
    script: "room.js",
    // 要传递给脚本的参数  例如 m=1 a=2
    args: "",
    // 进程数量
    instances: 1,
    // FORK新进程 PHP等其它脚本必须用fork
    //exec_mode: "fork",
    // 进程集群 仅NODE环境支持
    exec_mode: "cluster",
    // node参数 仅NODE环境支持
    node_args: "--harmony",
    // 是否合并所有进程的日志
    merge_logs: true,
    // 是否监控文件变动
    watch: false,
    // 不监控的文件夹
    ignore_watch: [
        "node_modules"
    ],
    log_date_format: "YYYY - MM - DD HH: mm Z",
    env: {
        // 环境变量
        "NODE_ENV": NODE_ENV,
        // DEBUG MODE
        "DEBUG": DEBUG_MODE
    }
});

console.log("Start @\n", JSON.stringify(config, null, 2), "\n@End");
module.exports = config;
