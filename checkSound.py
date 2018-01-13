#!/usr/bin/python

import json,os

effectPath = "/Users/tanzuoliang/Documents/projects/tank/res/sound"

def checkFile(dic):
	name = dic["src"]
	path = "%s/%s.mp3"%(effectPath,name)
	if not os.path.exists(path):
		print "can not find the sound named %s in res that wtite into config"%name
				
	

def checkSound():
	f = open("/Users/tanzuoliang/Documents/projects/tank/src/gameConfig/gameConfig.js","r")
	configKey = "gameConfig.sound"
	config = ""
	for line in f.readlines():
		if configKey in line:
			config = line[len("%s = "%configKey):len(line)-2]
			config = json.loads(config)
			break
	
	for key in config:
		checkFile(config[key])
		
	print "checkEffect sound complete......"
	

import glob
def check_AI():
	root = "/Users/tanzuoliang/Documents/projects/tank/res/ai"
	for fi in glob.glob("%s/*.json"%root):
		with open(fi,"r") as f:
			data = json.load(f)
			if not "root" in data:
				print "ai file %s is invalid"%fi		
	
	