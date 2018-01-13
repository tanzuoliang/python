#!/usr/bin/python
#encoding=utf-8

import shutil,os

_dir = {
	"00 通用" : "common",
	"00 icon" : "icon",
	"00 button" : "button",
	"00 wenzi" : "wenzi",
	"00 字体" : "fnt"			
}

fromRoot = ""
toRoot = ""

def copyDir(f,t):
	for fileName in os.listdir(f):
		if os.path.exists(os.path.join(f,fileName)):
			shutil.copy(os.path.join(f,fileName), os.path.join(t,fileName))

for (_f,_t) in _dir.iteritems():
	copyDir(os.path.join(fromRoot,_f), os.path.join(toRoot,_t))