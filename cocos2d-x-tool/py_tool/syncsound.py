#!/usr/bin/python
#encoding=utf-8

import shutil,sys,os,json
import inspect

from myutil.utils import copyFile,syncDir,copyDir,writeToFile,readFile,removeFile

reload(sys)
sys.setdefaultencoding("utf-8")

#project_root = "/Users/tanzuoliang/Documents/projects/new_tank/tank"
project_root = ".."

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
	baseFrom = "/Users/tanzuoliang/plan/天天坦克/程序可用资源/%s"%f
	baseTo  = "%s/res/%s"%(project_root,t)
	
	def dec(func):
		def wrapper():
			fromDir = baseFrom
			toDir = baseTo
			if not os.path.exists(toDir):
				os.makedirs(toDir)
			if not os.path.exists(fromDir):
				print "No such file or directory %s "%fromDir
				pass
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
	
#@syncDec(f="英文版音效",t="sound_lang_en")
#def syncSoundEn():
#	pass

def syncSoundEn():
	pass 	
	
@syncDec(f="背景图",t="background")
def syncBackground():
	pass

@syncDec(f="场景元素NPOT",t="scene")
def syncElement():
	pass
	
@syncDec(f="坦克道具iconNPOT",t="ico",cut=False)
def syncPropSkillIcon():
	pass
	
@syncDec(f="坦克配件iconNPOT",t="ico",cut=False)
def syncTankPartsIcon():
	pass	
	
@syncDec(f="坦克技能iconNPOT",t="ico",cut=False)
def syncSkillIcon():
	pass	
	
@syncDec(f="坦克展示界面的坦克图片NPOT",t="ico",cut=False)
def syncTankIcon():
	pass
@syncDec(f="坦克头像icoNPOT",t="ico",cut=False)
def syncTankHeadIcon():
	pass
	
@syncDec(f="特效文件NPOT",t="effect")	
def syncEffect():
	pass	
@syncDec(f="动作贴图NPOT",t="tank/action")	
def syncMovieClip():
	pass
	
@syncDec(f="伤害文字NPOT",t="tank/number")	
def syncBattleNumber():
	pass
		
@syncDec(f="编辑器用的贴图NPOT",t="editor")	
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

def syncSignalCocosEffect(from_dir,to_dir):
	for f in glob.glob("%s/*/*.*"%from_dir):
		t_f = os.path.join(to_dir, os.path.basename(f))
		copyFile(f,t_f)

def syncCocosEffect():
	root_path = "/Users/tanzuoliang/art_resource/天天坦克/特效文件"
	syncSignalCocosEffect(os.path.join(root_path,"cocos特效"), os.path.join(project_root,"res/cocos_effect"))
		
	"""
	要做好分语种资源分类处理 Y.英文特效
	"""
	syncSignalCocosEffect(os.path.join(root_path,"Y.英文特效"),os.path.join(project_root,"res/cocos_effect_lang_en"))
		
	"""
		同步电视资源
	"""
	syncDir(os.path.join(root_path,"电视端/Tank_effect_logo_tv"), os.path.join(project_root,"res/tv/res/cocos_effect"))	
					
