#!/usr/bin/python

from myutil.utils import repalceDirName
import os


def __decodeJS__(DIR="../src"):
	if not os.path.exists(os.path.join(DIR, "app.jsc")):
		command = 'cocos jscompile -s' + DIR + ' -d ' + DIR + '_new'
		os.system(command)
		repalceDirName(DIR,DIR + '_new')
		
		

def backToJS(DIR="../src"):
	if os.path.exists(os.path.join(DIR, "app.jsc")):
		repalceDirName(DIR,DIR + '_new')
		os.system("rm -rf %s"%(DIR + "_new"))	


def handr_for_ios():
	cmd = input("1:readyForIOS 2:backToNormal\n")
	if cmd == 1:
		__decodeJS__()
		repalceDirName("../res","../res-new")
		
		os.system("cp ../main.js ../mainjs/main.js")
		os.system('cocos jscompile -s ../mainjs  -d ../mainjs')
		
	elif cmd == 2:
		backToJS()
		repalceDirName("../res","../res-new")
			
handr_for_ios()
