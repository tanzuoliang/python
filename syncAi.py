#!/usr/bin/python
#encoding=utf-8

import shutil,sys,os

reload(sys)
sys.setdefaultencoding("utf-8")

def isJSONString(data):
	try:
		eval(data)
	except Exception as e:
		return False
	return True	

def trsnsformAI(file):
	f = open(file,"r")
	data = f.read();
	f.close()
	if not isJSONString(data):
		f = open(file,"w")
		f.write(data)
		f.close()

def syncAI():
	fromDir = "/Users/tanzuoliang/Documents/plan/天天坦克/程序可用资源/AI配置文件"
	toDir = "/Users/tanzuoliang/Documents/projects/tank/res/ai"
	for file in os.listdir(fromDir):
		toFile = "%s/%s"%(toDir,file)
		shutil.copy("%s/%s"%(fromDir,file), toFile)
		trsnsformAI(toFile)
		
	print "syncAI complete......"	