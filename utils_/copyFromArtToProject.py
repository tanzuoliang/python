#!/usr/bin/python
#encoding=utf-8

import shutil,os,re

_dir = {
	unicode("00 通用","utf8") : "common",
	"00 icon" : "icon",
	"00 button" : "button",
	"00 wenzi" : "wenzi",
	unicode("00 字体","utf8") : "fnt"			
}

baseRoot = "/Users/tanzuoliang"
unicodeRoot = unicode(baseRoot,"utf8")
toRoot = ""


def containsChinaWord(str):
	#return re.compile(u'[\u4e00-\u9fa5]+').search(str)
	return re.search(u'[\u4e00-\u9fa5]+', str)

def copyFile(fromf,tof):
	pass
	if os.path.exists(fromf) and os.path.getmtime(fromf) > os.path.getmtime(tof):
		shutil.copyfile(fromf, tof)
		print fromf, " ===> ",tof

def copyDir(f,t):
	if not os.path.exists(f) or not os.path.isdir(f):
		print f," is not exists or is file......"
		return
	for fileName in os.listdir(f):
		left = os.path.join(f,fileName)
		right = left.replace(f,t)
		if os.path.isdir(left):
			copyDir(left, right)
		else:
			copyFile(left,right)

if __name__ == "__main__":
	confL = "./config"
	#if not os.path.exists(confL):

	
	for (_f,_t) in _dir.iteritems():
		copyDir(os.path.join(unicodeRoot,_f), os.path.join(toRoot,_t))