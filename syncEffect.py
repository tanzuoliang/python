#!/usr/bin/python
#encoding=utf-8

import shutil,sys,os

reload(sys)
sys.setdefaultencoding("utf-8")

def syncEffect():
	fromDir = "/Users/tanzuoliang/Documents/plan/天天坦克/程序可用资源/特效文件"
	toDir = "/Users/tanzuoliang/Documents/projects/tank/res/effect"

	ret = "["
	index = 0
	for file in os.listdir(fromDir):
		shutil.copy("%s/%s"%(fromDir,file), "%s/%s"%(toDir,file))
		if os.path.splitext(file)[1] == ".plist":
			if index > 0:
				ret += " , "
			ret += '"' + file + '"'
			index = index + 1
	ret += "]"	
	
	print "syncEffect complete......"
#	print(ret)	
