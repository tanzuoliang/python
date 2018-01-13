#!/usr/bin/python

import os,sys,json

from utils import getConfig

recodeMap = {}
config = ""
dirctions = ["L","D","U"]

def recodePlist(path):
	f = open(path,"r")
	for line in f.readlines():
		if ".png</key>" in line:
			line = line.replace('<key>','').replace('</key>','').strip().replace(".png","")
			recodeMap[line] = 1

def startRecode(dir):
	for f in os.listdir(dir):
		if os.path.splitext(f)[1] == ".plist":
			recodePlist("%s/%s"%(dir,f))			
		

def checkTankAction(action_id):
	global recodeMap,config
	data = config[action_id]
#	print "action_id = %s"%action_id
	for d in dirctions:
		prefix = "%s_%s"%(action_id,d)
		
		for i in xrange(data["start_frame"],data["frame_count"] + 1):
			frameName = ""
			if i < 10:
				frameName = "%s_0000%d"%(prefix,i)
			else:
				frameName = "%s_000%d"%(prefix,i)
			
			if not frameName in recodeMap:
				print("missing res %s in plist"%(frameName))
				



def checkMovieClip():
	startRecode("/Users/tanzuoliang/Documents/projects/tank/res/tank/action")
#	readConfig("/Users/tanzuoliang/Documents/projects/tank/src/gameConfig/gameConfig.js")
	global config
	config = getConfig("gameConfig.tank_ani")
	for action_id in config:
		checkTankAction(action_id)
	print "checkMovieClip complete......"	
		
#checkMovieClip()										

	