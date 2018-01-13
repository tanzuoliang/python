#!/usr/bin/python
#encoding=utf-8

import fire

"""
把游戏中的配置文件过滤一些不必要的放到服务器上
"""
def createConfig(fromP,toP):
	filterKeys = ["buff","module","item","item_cate","prop","skill","skill_group","tank","tank_attr","skill_prop","tank_trigger","config"]
	with open(fromP,"r") as f, open(toP,"w") as t:
		t.write("let gameConfig = {};\n\n" + "\n\n".join([l for l in f.readlines() if "gameConfig." in l and l.split(" = ")[0].split(".")[1] in filterKeys]) + "\n\nmodule.exports.gameConfig = gameConfig;")

def execFun(m):
	if m == "tv":
		createConfig("../src/gameConfig/tv/gameConfig.js","../battle_server_tv/gameConfig.js")	
	elif m == "mobile":
		createConfig("../src/gameConfig/mobile/gameConfig.js","../battle_server_mobile/gameConfig.js")	

if __name__ == "__main__":
	fire.Fire(execFun)