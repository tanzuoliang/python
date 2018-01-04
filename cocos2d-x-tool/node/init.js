/**
 * @Author: wbsifan
 * @Date:   18-Sep-2017
 * @Email:  29500196@qq.com
 * @Last modified by:   wbsifan
 * @Last modified time: 22-Sep-2017
 */



// 要安装的包
const packages = {
    "colors": "^1.1.2",
    "commander": "^2.11.0",
    "debug": "^3.0.1",
    "ioredis": "^3.1.4",
    "ip": "^1.1.5",
    "needle": "^2.0.0",
    "ws": "^3.1.0",
    "nan": "^2.4.0"
};



const cmd = require("child_process");
const fs = require("fs");

// 清除目录
{
    console.log(`Clear node_modules dir`);
    let stdstr = cmd.execSync("rm -fr node_modules")
    console.log(stdstr.toString());
}


// 安装包
for (let k of Object.keys(packages)) {
    console.log(`Start install module [${k}]`);
    let stdstr = cmd.execSync(`cnpm install ${k}`);
    console.log(stdstr.toString());
}



// 安装weejs
{
    console.log(`Start link module [weejs]`);
    let stdstr = fs.symlinkSync(fs.realpathSync("./weejs"), `./node_modules/weejs`);
}




{
    console.log(`Start link [node-kcp]`);
    let stdstr = fs.symlinkSync(fs.realpathSync("./node-kcp"), `./node_modules/node-kcp`);
}

// 安装node-kcp fix
{
    console.log(`Start build [node-kcp]`);
    let stdstr = cmd.execSync(`cd ./node-kcp && cnpm run install`);
    console.log(stdstr.toString());
}


console.log("do sucess!");
