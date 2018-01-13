#!/usr/bin/python
#encoding=utf-8
"""
把游戏中的配置文件过滤一些不必要的放到服务器上
"""

pa = "../src/gameConfig/gameConfig.js"
toP = "../kcp_server/gameConfig.js"

#filterKeys = ["effect","map_bg","sound","tank_ani","tank_model","level","map_pvp","tutorial","tip","task","normal","cocos_effect","bank","battle_report","compete_reward","func","setting"]
filterKeys = ["buff","module","item","item_cate","prop","skill","skill_group","tank","tank_attr","skill_prop","tank_trigger","config"]
with open(pa,"r") as f, open(toP,"w") as t:
	
	t.write("let gameConfig = {};\n\n" + "\n\n".join([l for l in f.readlines() if "gameConfig." in l and l.split(" = ")[0].split(".")[1] in filterKeys]) + "\n\nmodule.exports.gameConfig = gameConfig;")