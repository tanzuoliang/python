#!/usr/bin/python

import os,json

publishlist = ["find.py","gitup.py","rmlog.py"]
mktimeFile = ".config"
mktimeDic = None


def loadConfig():
	global mktimeFile,mktimeDic
	if os.path.exists(mktimeFile):
		with open(mktimeFile,"r") as f:
			mktimeDic = json.load(f)
	else:
		mktimeDic = {}	
def saveConfig():
	global mktimeFile,mktimeDic
	with open(mktimeFile,"w") as f:
		print mktimeDic
		json.dump(mktimeDic, f, indent = 2)		

def isFileUpdate(filename):
	ret = False
	nowTime = os.path.getmtime(filename)
	
	if filename in mktimeDic:
		lastTime = mktimeDic[filename]
		ret = nowTime > lastTime
	else:
		ret = True
	if ret:
		mktimeDic[filename] = nowTime
	return ret		
		
if __name__ == "__main__":
	loadConfig()
	hasUpdate = False
	for filename in publishlist:
		if isFileUpdate(filename):
			cmd = "sudo cp ./%s /usr/local/bin/%s && sudo chmod 777 /usr/local/bin/%s"%(filename,filename,filename)
			os.system(cmd)
			print "execute %s"%cmd
			hasUpdate = True
	if hasUpdate:
		saveConfig()		
			