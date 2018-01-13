#!/usr/bin/python
#/usr/bin/env python

"""
please do not remove this function
"""
import json,os,re

def getConfig(key):
	with open("/Users/tanzuoliang/Documents/projects/tank/src/gameConfig/gameConfig.js","r") as f:
		data = f.read();
		return json.loads(re.findall(r'%s = ({.+});'%key, data)[0])
			
	

def read(fileName):
	with open(fileName,"r") as f:
		return f.read()

def readFrameKeys(filename):
	with open(filename,"r") as f:
		return re.findall(r'<key>(.+?)\.png</key>', f.read())
					

def showEffect(effect_id):
	effectConfig = getConfig("gameConfig.effect")
	data = effectConfig[effect_id]
	print data
	plistName = "/Users/tanzuoliang/Documents/projects/tank/res/effect/%s.plist"%data['src']
	print "-----------------------------------------------"
	print readFrameKeys(plistName)
	
#showEffect("40137")	