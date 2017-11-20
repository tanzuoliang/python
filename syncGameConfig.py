#!/usr/bin/python

#encoding=utf-8

import shutil,sys,os
import urllib2

reload(sys)
sys.setdefaultencoding("utf-8")

def syncGameConfig():
	url = "http://192.168.1.240/mysql/index.php?act=exportAllJson&db=tank_ext&table=all&curl"
	toPath = "/Users/tanzuoliang/Documents/projects/tank/src/gameConfig/gameConfig.js"
	data = urllib2.urlopen(url).read()

	f = open(toPath,"w")
	f.write(data)
	f.close()
	
	#os.system("svn commit -m add_file_%s %s"%(toPath,toPath))
	
	print "syncGameConfig successful"
