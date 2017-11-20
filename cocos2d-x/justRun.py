#!/usr/bin/python

import os,time,datetime

tag = time.strftime('%Y-%m-%d',time.localtime())

root = os.path.dirname(__file__)

configP = "%s/.config%s"%(root,tag)

n = 1
if os.path.exists(configP):
	with open(configP,"r") as f:
		n = int(f.read())


resu = "%s_%d"%(tag,n)

flag = "dev"

import json
with open("platform.json","r") as f:
	_d = json.loads(f.read())
	if _d["game_loginUrl"] == 'http://182.254.155.127:8000/gateway.php':
		flag = "t0"
	elif _d["game_loginUrl"] == 'http://115.159.214.90:8000/gateway.php':
		flag = "t1"
	else:
		flag = "dev"		

old = "%s/tank-release-signed.apk"%root
new = "%s/tank-%s-%s.apk"%(root,flag,resu)
if os.path.exists(old):
	os.rename(old, new)

	with open(configP,"w") as f:
		f.write(str(n + 1))
	print "rename file %s to %s successfuly"%(old,new)	
else:
	print "can not find file %s"%old		
	