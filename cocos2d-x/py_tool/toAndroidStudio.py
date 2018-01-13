#!/usr/bin/python

import os
from myutil.utils import syncDir

toPath = "../frameworks/runtime-src/proj.android-studio/app/assets"
def copyFromAndroidproject():
	#
	fromPath = "../frameworks/runtime-src/proj.android/assets"
	#
	copyDirs = ["res","src"]
	for item in copyDirs:
		syncDir(os.path.join(fromPath,item), os.path.join(toPath, item))

	#copyList = ["main.jsc","project.json"]
	copyList = ["main.jsc"]

	for item in copyList:
		os.system("cp %s %s"%(os.path.join(fromPath, item),os.path.join(toPath, item)))
		

def copyResFromproject():
	fromPath = ".."
	floder = "res"
#	os.system("rm -rf %s"%(os.path.join(toPath, floder)))
	syncDir(os.path.join(fromPath,"res-new"), os.path.join(toPath, floder))
	
def copySrcFromproject():
	fromPath = ".."
	floder = "src"
#	os.system("rm -rf %s"%(os.path.join(toPath, floder)))
	syncDir(os.path.join(fromPath,floder), os.path.join(toPath, floder))
	main_js = os.path.join(toPath, "main.js")
	if os.path.exists(main_js):
		os.system('rm %s'%main_js)
	os.system("cp ../mainjs/main.jsc %s"%os.path.join(toPath, "main.jsc"))
#copyResFromproject()		
copySrcFromproject()
#copySrcFromproject()
#os.system("cp ../frameworks/runtime-src/proj.android/libs/armeabi/libcocos2djs.so ../frameworks/runtime-src/proj.android-studio/app/libs/armeabi/libcocos2djs.so")