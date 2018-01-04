#!/usr/bin/python
#encoding=utf-8
import re
data = None


def getSourceSets(chan):
	str = '\
${\n\
			java.srcDir "src/$/java"\n\
			tassets.srcDir "src/$/assets"\n\
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
		chan = "haha"
		data = data.replace("//sourceSets",getSourceSets(chan))
		data = data.replace("//productFlavors",getProductFlavors(chan))
	
	with open(path,"w") as f:
		f.write(data)	
	
	
