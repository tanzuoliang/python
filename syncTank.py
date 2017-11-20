#!/usr/bin/python

import os,shutil

webpath = '/Applications/XAMPP/xamppfiles/htdocs/game'
tankpath = '/Users/tanzuoliang/Documents/projects/tank'


def copyFile(f,t):
	has_to = os.path.exists(t)
	if not has_to or os.path.getmtime(f) > os.path.getmtime(t):
		toDir = os.path.dirname(t)
		if not os.path.exists(toDir):
			os.makedirs(toDir)
		print("sync file %s to web"%fileF.replace(tankpath, ""))
		shutil.copy(f, t)
		


for item in os.walk(tankpath):
	if not item[2]:
		continue
	
	for f in item[2]:
#		print item
		fileF = os.path.join(item[0],f)
		if ".idea" in fileF or ".DS_Store" in fileF or ".gitignore" in fileF:
			continue
		fileT = fileF.replace(tankpath,webpath)
		copyFile(fileF,fileT)
		
print "-------------------- sync complete --------------------------------"		