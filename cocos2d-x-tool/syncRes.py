#usr/local/bin

import os
from myutil.utils import syncDir,copyFile

def syncDirs(fromDir,toDir,l):
	
	for d in l:
		syncDir(os.path.join(fromDir,d), os.path.join(toDir,d))

def syncFiles(fromDir,toDir,fl):
	for f in fl:
		copyFile(os.path.join(fromDir,f),os.path.join(toDir,f))	


def commit(p):
	os.chdir(p)
	os.system("gitup.py")

if __name__ == "__main__":
	
	"""
-------------------------------------------------------------------------------------------
	"""
	
	fromDir = "."
	toDir = "/Users/tanzuoliang/Documents/study/python/cocos2d-x-tool"
	l = ["aapt","helper","py_tool","node","battle_server_mobile","battle_server_tv"]
	fl = ["create.py","hot_res.py","syncRes.py"]
	"""
-------------------------------------------------------------------------------------------
	"""
	
	syncDirs(fromDir,toDir,l)
	syncFiles(fromDir, toDir, fl)
	commit(toDir)
	print "successfully"