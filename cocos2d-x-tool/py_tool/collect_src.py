#!/usr/bin/python

import os,sys,re

project_dir = "../"

moduleList = ["library_core",'game_ai']
fileList = []

def readModule():
	global moduleList
	with open(os.path.join(project_dir, "src","module.js")) as f:
		data = f.read()
		for ll in re.findall('(module_.+)\"',data):
			moduleList.append(ll)
		
def readFile():
	for item in moduleList:
		print item
		with open(os.path.join(project_dir, 'src','include','%s.js'%item)) as f:
			data = f.read()
			for l in re.findall('(src/.+)\"',data):
				fileList.append(l)
		
readModule()
readFile()
print fileList
print len(fileList)	
		