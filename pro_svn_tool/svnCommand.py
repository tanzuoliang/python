#!/usr/bin/python
#encoding=utf-8
import shutil,sys,os,time
from checkEffect import checkEffect
from checkMovieClip import checkMovieClip
from checkSound import checkSound,check_AI
from myutil.utils import getDirsize,repalceDirName

from syncsound import syncSound , syncBackground ,syncElement,syncPropSkillIcon,syncSkillIcon,syncTankIcon,syncTankHeadIcon,syncEffect,syncMovieClip,syncAI,syncEditor,syncCocosEffect,syncPveMap
from checkConfig import CheckConfig

reload(sys)
sys.setdefaultencoding("utf-8")

#project_path = "/Users/tanzuoliang/Documents/projects/new_tank/tank"
project_path = "../"
def updatePlan():
	svnPath = "/Users/tanzuoliang/Documents/plan/天天坦克"
	os.system("svn up %s"%svnPath)
	os.system("svn up /Users/tanzuoliang/Documents/projects/art/天天坦克/特效文件/cocos特效")
	print "updatePlan 天天坦克 complete......"

from myutil.utils import getDirsize
def updateProjects():
	ppp = os.path.join(project_path,'res-new')
	if os.path.exists(ppp) and getDirsize(os.path.join(project_path,'res')) < getDirsize(ppp):
		return;
		print "当前res是压缩后的"	
	
	rootPath = project_path
	
	pathList = ["src","res","main.js","project.json"]
	
	for r in pathList:
		path = os.path.join(rootPath,r)
		os.system("svn up %s"%path)
		
	print "update projects complete......"	
	
	
	
def checkSVNStatus():
	if not os.path.exists("svnlog"):
		os.makedirs("svnlog")
		f = open("svnlog/data.cnt",'w')
		f.write("1")
		f.close()
	cnt = 0
	f = open("svnlog/data.cnt",'r')
	cnt = int(f.read()) + 1
	f.close()
	f = open("svnlog/data.cnt",'w')
	f.write(str(cnt))
	f.close()
	
		
	svnLogPath = "svnlog/data_%d.bin"%cnt	
	rootPath = project_path
	pathList = ["src","res"]
	for f in pathList:
		path = os.path.join(rootPath,f)
		os.system("svn status %s >> %s"%(path,svnLogPath))
	
	f = open(svnLogPath,"r")	
	for line in f.readlines():
		status = line[:1]
		_f = line[1:].strip()
		print(" status = %s , file = %s"%(status,_f))
		if status == "?":
			os.system("svn add %s"%_f)
#			os.system("svn commit -m add_file_%s %s"%(_f,_f))
		elif status == "!":
			os.system("svn delete %s"%(_f))	
		elif status == "A":
#			os.system("svn commit -m add_file_%s %s"%(_f,_f))
			pass	
		
	
def commitProjects():
#	updateProjects()
	checkSVNStatus()
	rootPath = project_path
	pathList = ["src","res","main.js","project.json"]
#	pathList = ["src","res","project.json"]
#	commitInfo = raw_input("commit info:\n")
#	commitInfo = "'" + commitInfo + "'"
#	commitInfo = ""	
	for r in pathList:
		path = os.path.join(rootPath,r)
		os.system("svn commit -m '""' %s"%(path))
			
	print "commit projects complete......"	
	
	
def updateArt():
	svnPath = "/Users/tanzuoliang/Documents/projects/art/天天坦克"
	os.system("svn up %s"%svnPath)
	print "updateArt 天天坦克 complete......"	
	

def syncRes():
	res = os.path.join(project_path, "res")
	res_new = os.path.join(project_path, "res-new")
	if os.path.exists(res_new):
		if getDirsize(res) < getDirsize(res_new):
			repalceDirName(res,res_new)
			print "change dir %s form %s"%(res,res_new)	
		
	syncAI()
	syncEffect()
	syncMovieClip()
	syncSound()
	syncBackground()
	syncElement()
	syncPropSkillIcon()
	syncSkillIcon()
	syncTankIcon()
	syncTankHeadIcon()
	syncEditor()
	syncCocosEffect()
	syncPveMap()	
	
def copyPlatformJSON():
	rootPath = project_path
	for js in ["platform.json","game_version.json"]:
		shutil.copy(os.path.join(rootPath,js), os.path.join(rootPath, "frameworks/runtime-src/proj.android/assets/%s"%js))
		
	
while True:
	cmd = raw_input("0:exit\n1:updatePlan\n2:updateArt\n3:updateProjects\n4:commitProjects\n")
	if cmd in ["1","2","3","4","5"]:
		if cmd == "1":
			updatePlan()
			sync = raw_input("1:sync\n2:nothing\n")
			if sync == "1":
				syncRes()
			else:
				print "do nothing"	
			
		elif cmd == "2":
			updateArt()
		elif cmd == "3":
			updateProjects()
		elif cmd == "4":
			commitProjects()
	elif cmd == "0":
		sys.exit()
	elif cmd == "check":
		c = raw_input("0:all\n1:checkEffect\n2:checkMovieClip\n3:checkSound\n4:skill\n5:checkConfig\n6:check_Ai\n")
		if c == "0":
			checkEffect()
			checkMovieClip()
			checkSound()
		elif c == "1":
			checkEffect()
		elif c == "2":
			checkMovieClip()
		elif c == "3":
			checkSound()
		elif c == "4":
			os.system("python checkSkill.py")
		elif c == "5":
			CheckConfig().startup()
		elif c == "6":
			check_AI()					
	elif cmd == "open":
		f = raw_input("1:plan\n2:art\n3:project\n4:project_ios\n5:project_android\n")
		if f == "1":
			os.system("open %s"%"/Users/tanzuoliang/Documents/plan/天天坦克/可执行文档")
		elif f == "2":
			os.system("open %s"%"/Users/tanzuoliang/Documents/projects/art/天天坦克")
		elif f == "3":
			os.system("open %s"%project_path)
		elif f == "4":
			os.system("open %s"%os.path.join(project_path,"frameworks/runtime-src/proj.ios_mac"))
		elif f == "5":
			os.system("open %s"%os.path.join(project_path,"frameworks/runtime-src/proj.android"))
	elif cmd == "soft":
		s = raw_input("1:webstorm\n2:xcode")
		if s == "1":
			os.system("open /Applications/WebStorm.app")
		elif s == "2":
			os.system("open /Applications/Xcode.app")
	elif cmd == "cmd":
		command = raw_input("input you command\n0:exit\n1:compile android\n")
		if command == "0":
			pass
		else:
			os.system(command)
	elif cmd == "copy":
		i = raw_input("1:copyPlatformJSON\n")
		if i == "1":
			copyPlatformJSON()
	elif cmd == "run":
		os.system("open /Users/tanzuoliang/Documents/study/python/android/dist/android")
	elif cmd == "sync":
		syncRes()
	elif cmd == "sta":
		rootPath = project_path
		for p in ["res","src"]:
			pa = os.path.join(rootPath,p)
			print "svn status %s"%pa
			os.system("svn status %s"%pa)
	elif cmd == "sl":
		rootPath = project_path
		for p in ["res","src"]:
			pa = os.path.join(rootPath,p)
			print "svn status %s"%pa
			os.system("svn log %s"%pa)				
				
										
													
		
	
	
	
		