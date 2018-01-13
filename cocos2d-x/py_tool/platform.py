#!/usr/bin/python
#encoding=utf-8

"""
{
	"game_loginUrl":"http://192.168.10.240:8000/gateway.php",
	"platform_name":"tianyi",
	"platform_type":0,
	"platform_desc":"无信息"
}
"""


import json,shutil,re

json_path = "../platform.json"

with open(json_path,"r") as f:
	data = f.read()

sel = input("0:内网\n1:外网测试\n2:外网\n")
#replaceStr	 = SERVER_IN if sel == 0 else SERVER_OUT
#data = re.sub(r'http://.+?:',replaceStr,data)
import json

"""
 game_loginUrl ： 游戏地址
 sdk_loginUrl ： SDK登入地址
 showFPS : 是否显示FPS
 lang ： 包的默认语言 1:中文 2:英文		
 share_type ： 1: facebook 2:微信		
"""

with open(json_path,"r") as f:
	_d = json.loads(f.read())
	if sel == 0:
		"""
		http://182.254.155.127:8021/?m=open&locate=china
		"""
		_d["game_loginUrl"] = 'http://192.168.10.240:8000/gateway.php'
		_d["sdk_loginUrl"] = "http://192.168.10.240:8020/?m=open&locate=china"
		_d["showFPS"] = True
		_d["lang"] = 1
		_d["share_type"] = 1
		_d["showError"] = True
	elif sel == 1:
		_d["game_loginUrl"] = "http://182.254.155.127:8000/gateway.php"
#		_d["sdk_loginUrl"] = "http://182.254.155.127:8020/?m=open&locate=china"	
		_d["sdk_loginUrl"] = "http://open-t0.tianyi-game.com/?m=open&locate=china"	
		_d["showFPS"] = False
		_d["lang"] = 1
		_d["share_type"] = 1
		_d["showError"] = True
	elif sel == 2:
		_d["game_loginUrl"] = 'http://115.159.214.90:8000/gateway.php'
		_d["sdk_loginUrl"] = "http://open-online.tianyi-game.com?m=open&locate=china"	
		_d["showFPS"] = False
		_d["lang"] = 1
		_d["share_type"] = 1
		_d["showError"] = True
	

print data
with open(json_path,"w") as f:
	r = json.dumps(_d,indent=2)
	print r
	f.write(r)


shutil.copy(json_path, "../frameworks/runtime-src/proj.ios_mac/platform.json")	
#shutil.copy(json_path, "../frameworks/runtime-src/proj.android-studio/app/assets/platform.json")