#!/usr/bin/python
from helper.respack import PackRes
from myutil.utils import repalceDirName
import os


def checkDir(fr,to):
	ls = []
	for item in os.walk(fr):
		if not item[2]:
			continue
		for f in item[2]:
			if not ".DS" in f:
				ls.append(os.path.join(item[0], f))
	for f in ls:
		ff = f.replace(fr,to)
		if not os.path.exists(ff):
			print	"lose file ",ff		

p = PackRes("res","res-new")

def compressRes():
	p.run()
	checkDir("res-new","res")

def uncompressRes():
	p.resBackToNormal()	
	

def handr_res():
	p = PackRes("res","res-new")
	cmd = input("1:compress 2:uncompress\n")
	if cmd == 1:
		p.run()
		checkDir("res-new","res")
	elif cmd == 2:
		p.resBackToNormal()
		

def __decodeJS__(DIR="src"):
	if not os.path.exists("src/app.jsc"):
		command = 'cocos jscompile -s' + DIR + ' -d ' + DIR + '_new'
		os.system(command)
		repalceDirName(DIR,DIR + '_new')

def backToJS(DIR="src"):
	if os.path.exists("src/app.jsc"):
		repalceDirName(DIR,DIR + '_new')
		os.system("rm -rf %s"%(DIR + "_new"))		

			
handr_res()
