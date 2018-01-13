#!/usr/bin/python

import json,os

effectPath = "/Users/tanzuoliang/Documents/projects/tank/res/effect"
config = ""


recodeMap = {}

def checkFile(dic):
	global recodeMap
	src = dic["src"]
	
	if "L" in src:
		if not dic["rotate"] == 1:
			print "effect id %s has error config filed rotate whick need set for 1,but give %d"(dic["id"],dic["rotate"])
	
	path = "%s/%s.plist"%(effectPath,src)	
	if not os.path.exists(path):
		print "can not find the file %s"%path
		print dic
		return
	cnt = 0;
	f = open(path,"r")
	for line in f.readlines():
		if ".png</key>" in line:
			cnt = cnt + 1
			#2016_atklaunch_U_00021_00001.png
			info = line.replace('<key>','').replace('</key>','').strip().replace(".png","")
			if not src == info[:len(info)-6]:
				print "%s frame %s error "%(src,info)
	if cnt != dic["frame_count"]:
		print("path = %s error effect %s config set %d frames , but plist only %d frames"%(path,dic["id"],dic["frame_count"],cnt))
	else:
		if "L" in src or "U" in src or "D" in src:
			_id = src[0:len(src)-2]
			_dir = src[len(src)-1:]
			if not _id in recodeMap:
				recodeMap[_id] = {}
			recodeMap[_id][_dir] = cnt	
			 	
				
	

def checkEffect():
	f = open("/Users/tanzuoliang/Documents/projects/tank/src/gameConfig/gameConfig.js","r")
	for line in f.readlines():
		
		if "gameConfig.effect" in line:
			config = line[len("gameConfig.effect = "):len(line)-2]
			config = json.loads(config)

	for key in config:
		checkFile(config[key])
#	print json.dumps(recodeMap,indent=2)
	print " -------------------------------------------------------------------------- "
	for key in recodeMap:
		cnt = 0
		for _d in recodeMap[key]:
			cnt = cnt + 1
		if not cnt == 3:
			print "%s has error config %d"%(key,cnt) 		
	print "checkEffect complete......"	

