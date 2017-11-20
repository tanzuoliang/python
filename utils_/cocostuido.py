#!/usr/bin/python
#encoding=utf-8

import shutil,os

dirList = ["common","button","fnt","icon","wenzi"]
CocosStudioDir = "D:\Documents\\tankProject\\battleControlUI\Export"
projectDir = "E:\project\client\\tank\\res\\new_ui"


def copyFile(fromFile,toFile):
	if  not os.path.exists(toFile) or os.path.getmtime(toFile) < os.path.getmtime(fromFile):
		shutil.copy(fromFile,toFile)
		print "copy from %s to %s"%(fromFile,toFile)
	else:
		print "ignore file ",fromFile	

def copyDir(fromDir,toDir):
	for (root,ch,_list) in os.walk(fromDir):
		if not _list:
			continue
		for f in _list:
			fromFile = os.path.join(root, f)
			toFile = fromFile.replace(fromDir,toDir)
			copyFile(fromFile,toFile)


def scanDir(d):
	for _dir in os.listdir(d):
		totalDir = os.path.join(d,_dir)
		if os.path.isdir(totalDir):
			for _dir in dirList:
				from_ = os.path.join(totalDir,_dir)
				to_ = from_.replace(totalDir,projectDir)
				#copyDir(from_,to_)

			for fi in os.listdir(totalDir):
				filePath = os.path.join(totalDir,fi)
				if os.path.isfile(filePath) and os.path.splitext(filePath)[1] == ".json":
					copyFile(filePath,filePath.replace(totalDir,projectDir))	
		
		else:
			print "%s is not a directory"%_dir		

scanDir(CocosStudioDir)				
	