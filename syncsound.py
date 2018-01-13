#!/usr/bin/python
#encoding=utf-8

import shutil,sys,os,json
import inspect

from myutil.utils import copyFile,syncDir,copyDir,writeToFile,readFile,removeFile

reload(sys)
sys.setdefaultencoding("utf-8")

#project_root = "/Users/tanzuoliang/Documents/projects/new_tank/tank"
project_root = "/Users/tanzuoliang/projects/branches/branch20170724"

def isJSONString(f):
	try:
		eval(data)
	except Exception as e:
		return False
	return True	

def trsnsformAI(file):
	f = open(file,"r")
	data = f.read();
	f.close()
	if not isJSONString(data):
		with open(file,"w") as f:
			f.write(data)
		print "handle ai file ",file	

def syncDec(f,t,cut=True):
	baseFrom = "/Users/tanzuoliang/Documents/plan/天天坦克/程序可用资源/%s"%f
	baseTo  = "%s/res/%s"%(project_root,t)
	
	def dec(func):
		def wrapper():
			fromDir = baseFrom
			toDir = baseTo
			if not os.path.exists(toDir):
				os.makedirs(toDir)
			
			from_list = os.listdir(fromDir)
			
			for file in from_list:
				if "DS_Store" in file:
					continue
				ff = "%s/%s"%(fromDir,file)
				tt = "%s/%s"%(toDir,file)
				if not os.path.exists(tt) or os.path.getmtime(ff) > os.path.getmtime(tt):
					shutil.copy(ff, tt)
					print "copy:",ff," ========> ",tt
					if len(inspect.getargspec(func)[0]) == 1:
						func(tt)	
			to_list = os.listdir(toDir)
			
			if cut:
				for _f in to_list:
					ff = "%s/%s"%(fromDir,_f)
					tt = "%s/%s"%(toDir,_f) 
					if not os.path.exists(ff):
						removeFile(tt)			
			
			print "sync %s successfully......"%f
			
		return wrapper
	return dec				

@syncDec(f="sound",t="sound")
def syncSound():
	pass
	
@syncDec(f="背景图",t="background")
def syncBackground():
	pass

@syncDec(f="场景元素",t="scene")
def syncElement():
	pass
	
@syncDec(f="坦克道具icon",t="ico",cut=False)
def syncPropSkillIcon():
	pass
	
@syncDec(f="坦克技能icon",t="ico",cut=False)
def syncSkillIcon():
	pass	
	
@syncDec(f="坦克展示界面的坦克图片",t="ico",cut=False)
def syncTankIcon():
	pass
@syncDec(f="坦克头像ico",t="ico",cut=False)
def syncTankHeadIcon():
	pass
	
@syncDec(f="特效文件",t="effect")	
def syncEffect():
	pass	
@syncDec(f="动作贴图",t="tank/action")	
def syncMovieClip():
	pass
@syncDec(f="编辑器用的贴图",t="editor")	
def syncEditor():
	pass	
	
@syncDec(f="经典模式地图",t="pveMap")	
def syncPveMap():
	pass		
	
@syncDec(f="AI配置文件",t="ai")	
def syncAI(file):
	trsnsformAI(file)
	pass
	
import glob	
def syncCocosEffect():
	from_dir = "/Users/tanzuoliang/Documents/projects/art/天天坦克/特效文件/cocos特效"
	to_dir = "%s/res/cocos_effect"%project_root
#	os.system("rm -rf %s"%to_dir)
	for f in glob.glob("%s/*/*.*"%from_dir):
		t_f = os.path.join(to_dir, os.path.basename(f))
		copyFile(f,t_f)
	#os.system("rm -rf /Users/tanzuoliang/Documents/study/cocos_effect_view/MyJSGame/res/cocos_effect")	
#	syncDir("%s/res/cocos_effect"%project_root,"/Users/tanzuoliang/Documents/plan/天天坦克/cocos_effect/res/cocos_effect")
#	hand_test()
def hand_test():
	root = "/Users/tanzuoliang/Documents/plan/天天坦克/cocos_effect"
#	root = '/Users/tanzuoliang/Downloads/cocos_effect_1'
	p = "%s/src/resource.js"%root
	e_list = [ os.path.splitext(r.replace("%s/res/cocos_effect/"%root,""))[0] for r in glob.glob("%s/res/cocos_effect/*.ExportJson"%root)]
	g_resources = [ r.replace("%s/"%root,"") for r in glob.glob("%s/res/cocos_effect/*.*"%root)]
	import json
	ret = "var g_resources = %s;\nvar e_list = %s"%(json.dumps(g_resources),json.dumps(e_list))
#	print ret
	writeToFile(p, ret)
#syncCocosEffect()	
#syncCocosEffect()	
#os.system("rm -rf /Users/tanzuoliang/Documents/study/cocos_effect_view/MyJSGame/res/cocos_effect")	
#copyDir("/Users/tanzuoliang/Documents/projects/tank/res/cocos_effect","/Users/tanzuoliang/Documents/study/cocos_effect_view/MyJSGame/res/cocos_effect")	
						
#print [ os.path.splitext(r.replace("/Users/tanzuoliang/Documents/study/cocos_effect_view/MyJSGame/res/cocos_effect/",""))[0] for r in glob.glob("/Users/tanzuoliang/Documents/study/cocos_effect_view/MyJSGame/res/cocos_effect/*.ExportJson")]						
