#!/usr/bin/python
#encoding=utf-8

from optparse import OptionParser	
import os
from myutil.utils import copyDir,readFile,writeToFile


def log(info):
	with open("android_channel_log.txt","a") as f:
		print >> f,info
	print info
	
def getInfo(chan):
	str = '\
	${\n\
		java.srcDir "src/$/java"\n\
		assets.srcDir "src/$/assets"\n\
		manifest.srcFile "src/$/AndroidManifest.xml"\n\
	}\n\n\n\
	\
	${\n\
		versionCode 1\n\
		versionName "1.0.1"\n\
		applicationId "com.tianyi.tank.tv.$"\n\
		manifestPlaceholders = [TD_CHANNEL_VALUE: "$",\n\
						TD_APP_ID_VALUE : "5bkn6oevavfncn6m"]\n\
	}'
	return str.replace('$',chan)
	

def getSourceSets(chan):
	str = '\
${\n\
			java.srcDir "src/$/java"\n\
			assets.srcDir "src/$/assets"\n\
			jniLibs.srcDir "src/$/libs"\n\
			manifest.srcFile "src/$/AndroidManifest.xml"\n\
		}\n\n\
		//sourceSets\n\n'
	return str.replace('$',chan)
	
def getProductFlavors(chan):
	str = '\
${\n\
			versionCode 1\n\
			versionName "1.0.1"\n\
			applicationId "com.tianyi.tank.tv.$"\n\
			manifestPlaceholders = [TD_CHANNEL_VALUE: "$",\n\
							TD_APP_ID_VALUE : "5bkn6oevavfncn6m"]\n\
		}\n\n\
		//productFlavors\n\n'
	return str.replace('$',chan)



def addChanndelConfigToBuildGradle(chan,path):
	with open(path,"r") as f:
		data = f.read()
		data = data.replace("//sourceSets",getSourceSets(chan))
		data = data.replace("//productFlavors",getProductFlavors(chan))
	
	with open(path,"w") as f:
		f.write(data)				

import json
def handleplatformjson(chan,fPath,isTV):
	obj = json.loads(readFile(fPath))
	obj['platform_name'] = chan
	obj['isTV'] = isTV
	"""
		1 : facebook
		2 : wx
	"""
	obj['share_type'] = 2
	
	"""
		1: 简体中文
		2: 英文
	"""
	obj['lang'] = 1
	
	"""
		是否显示JS错误
	"""
	obj['showError'] = False
	
	"""
	platform_type 目前没用到
	"""
	
	writeToFile(fPath, json.dumps(obj,indent=2)) 
	
#chan = 'ysten'
#handleplatformjson(chan,os.path.join('../frameworks/runtime-src/proj.android-studio/app/src',chan, "assets","platform.json"))

if __name__ == '__main__':
	parser = OptionParser()
	parser.add_option('-c', '--channel',dest='channel',help='android channel')
	parser.add_option('-tv', '--isTV',dest='isTv',help='isTV')
		
	(option,_) = parser.parse_args()
	if option.channel and option.tv:
		isTV = True
		platform_ch = "tv"
		if isTV == "0":
			isTV = False
			platform_ch = "mobile"
		chan = option.channel
		Root = "../frameworks/runtime-src/proj.android-studio/app"
		To_Root = "%s/src/%s"%(Root,chan)
		if not os.path.exists(To_Root):
			os.mkdir(To_Root)
			copyDir(os.path.join(Root, "temaplte/channel"),To_Root)
#			copyDir(os.path.join(Root, "temaplte/platform/%s"%platform_ch), To_Root)
			os.system("svn add %s"%To_Root)
			os.system("svn ci -m '' %s"%To_Root)
			
			log("-------------------- start %s ------------------"%chan)
			log(getInfo(chan))
			log("-------------------- end %s ------------------"%chan)
			
			addChanndelConfigToBuildGradle(chan,os.path.join(Root, "build.gradle"))
			handleplatformjson(chan,os.path.join(To_Root, "assets","platform.json"),isTV)
			
		else:
			print "%s has exists"%chan	
	else:
		print "please input a channel"	