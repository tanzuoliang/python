#!/usr/bin/python
#encoding=utf-8

import shutil,os,glob,re

ignoreSVNList = [".DS_Store",".svn",".git"]


def replaceStr(root,f,t):
	return root.replace(f,t,1)

def removeFile(src):
	if os.path.exists(src) and os.path.isfile(src):
		print "remove:",src
		os.remove(src)
		
def removeDir(src):
	if os.path.exists(src) and os.path.isdir(src):	
		print "remove:",src
		shutil.rmtree(src)	

def copyFile(src,dst):
	if not os.path.exists(src):
		print "can not find the file ",src
		return
	if ".DS_Store" in src:
		print "ignore file %s"%src
		return
	if not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst):
		print "copy:",src," ======> ",dst
		d = os.path.dirname(dst)
		if not os.path.exists(d):
			os.makedirs(d)
		shutil.copy(src, dst)
		

def copyDir(src,dst,filterList = [],invert = False):
	if not os.path.isdir(src):
		raise Exception("%s is not a dir"%src)	
	for (root,childRoot,children) in os.walk(src):
		if not children:
			continue
		for fi in children:
			if os.path.basename(fi) in ignoreSVNList:
				continue
			if len(filterList) > 0 and not invert == os.path.splitext(fi) in filterList:
				continue	
			dstRoot = replaceStr(root,src,dst)	
			if not os.path.exists(dstRoot):
				os.makedirs(dstRoot)
					
			srcPath = os.path.join(root, fi)
			dstPath = replaceStr(srcPath,src,dst)
			copyFile(srcPath, dstPath)
			


def findFileListDec(fun):
	def warper(src,suffix="*"):
		it = fun(src,suffix)
		print "search src = %s,suffix = %s"%(src,suffix)
		for i in it:
			print i
	return warper		

@findFileListDec
def findFileList(src,suffix="*"):
	if os.path.isfile(src):
		return iter([src]) if os.path.splitext(src)[1] == "." + suffix or suffix == "*" else iter([])
	elif os.path.isdir(src):
		return glob.iglob("%s/*.%s"%(src,suffix))
	
	return iter([])
	


def compareDir(src,dst,srcLose = [],dstLose = [],update=[]):
	if not os.path.isdir(src):
		print "%s is not a dir"%src
		return
	srcList = os.listdir(src)
	if os.path.exists(dst):
				
		dstList = os.listdir(dst)

		for f in dstList:
			if not f in srcList:
				srcLose.append(os.path.join(dst,f))
		for f in srcList:
			srcFile = os.path.join(src,f)
			dstFile = replaceStr(srcFile,src,dst)
			isFile = os.path.isfile(srcFile)
			if not f in dstList and not os.path.join(dst,f) in srcLose:
				dstLose.append(srcFile)
			else:
				if isFile and os.path.getmtime(srcFile) > os.path.getmtime(dstFile):
					update.append(srcFile)		
			if os.path.isdir(srcFile):
				compareDir(srcFile,dstFile,srcLose,dstLose,update)
	else:
		dstLose = [os.path.join(src,f) for f in srcList]			
	
	"""
		src 目标文件夹里多出的文件（要删除的文件）
		dst 目标文件夹里不存在文件（新文件）
	"""			
	return {
		src : srcLose,
		dst : dstLose,
		'update' : update
	}					
	
def syncDir(src,dst,REMOVE=True,filterList=[]):
	if not os.path.exists(dst):
		os.mkdir(dst)
	ret = compareDir(src, dst)
	print ret
	if REMOVE:
		for f in ret[src]:
			removeFile(f)
	for f in ret[dst]:
		if os.path.basename(f) in filterList:
			print "filter file ",f
			continue 
		if os.path.isfile(f):
			copyFile(f, replaceStr(f,src,dst))
		elif os.path.isdir(f):
			copyDir(f, replaceStr(f,src,dst))
		else:
			print "%s is not f file or a dir"%f	
	for f in ret['update']:
		if os.path.basename(f) in filterList:
			print "filter file ",f
			continue
		copyFile(f, replaceStr(f,src,dst))							

def isNullLine(str):
	return False if str.strip() else True
	
def isNotNullLine(str):
	return not isNullLine(str)	

def writeToFile(src,data):
	with open(src,"w") as f:
		f.write(data)
		
def readFile(src,mode="r"):
	with open(src,mode) as f:
		return f.read()		
			
def trimFile(src):
	if not os.path.exists(src) or not os.path.isfile(src):
		return
	dataLines = None
	with open(src,"r") as f:
		dataLines = [line for line in f.readlines() if isNotNullLine(line)]
	if dataLines:
		writeToFile(src,"".join(dataLines))
		
import hashlib
def getMd5(info):
	md = hashlib.md5()
	md.update(info)
	return md.hexdigest()
#sha256	
def getHashlib(info,key="sha256"):
	md = hashlib.new(key)
	md.update(info)
	return md.hexdigest()
	
from xml.dom.minidom import Document
from xml.dom.minidom import parse	
def getXmlRoot(xml):
	if not os.path.exists(xml):
		print "%s is not exists"%xml
		return None
	if not os.path.splitext(xml)[1] == ".xml":
		print "%s is not a xml file type"%xml
		return None
	return parse(xml).documentElement

def saveXMLString(data,xml):
	result = data
	result = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" + result
	writeToFile(xml,result)

def saveXML(doc,xml):
#	result = doc.toprettyxml(indent = '')
	result = doc.toxml()
	result = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" + result
	writeToFile(xml,result)
	
"""
replace dir name
"""	
def repalceDirName(left,right):
	if not os.path.exists(left) or not os.path.exists(right):
		return
	os.rename(left, "temp__")
	os.rename(right, left)
	os.rename("temp__", right)
	
"""
"""
def checkSVNStatus(rootPath,pathList):
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
		elif status == "!":
			os.system("svn delete %s"%(_f))
			
"""
checkSVNStatus("/Users/tanzuoliang/Documents/projects/tank",["src","res"])
"""				

"""
	查找目录下指令类型文件大小大于某个值的文件（查找大文件）
"""		
def checkoutFileBySize(root,FILTER = [".png","jpg","jpeg"], SIZE=1024 * 1024 * 2):
	for(r,_,children) in os.walk(root):
		if not children:
			continue
			
		for f in children:
			ff = os.path.join(r, f)
			ext = os.path.splitext(ff)[1]
			if ext in FILTER:
				if os.path.getsize(ff) > SIZE:
					print ff,"  ",os.path.getsize(ff)
		
"""
	获取当前路径下所有文件列表（可选择指令类型）
"""	
def getFileListByExt(root,ext=None):
	ret = []
	for (d,_,child) in os.walk(root):
		if not child:
			continue
		for f in child:
			if ext == None or os.path.splitext(f)[1] == ext:
				ret.append(os.path.join(d,f))
	return ret
	
"""	
"""
def getDirsize(root):
	ret = 0
	for fi in getFileListByExt(root):
		ret = ret + os.path.getsize(fi)
	return ret						

"""
	查找指定目录下（可选文件类型）包含指定内容的文件
	返回文件列表 
"""
def findFileMatchStr(root,matchStr,ext=None):				
	for file in getFileListByExt(root,ext):
		ma = re.findall(matchStr, readFile(file))
		if len(ma) > 0:
			print file," ",ma	
			
"""
	模糊查找文件路径
"""			
def findFilePath(root,matchStr):
	(_name,ext) = os.path.splitext(matchStr)
	for file in	getFileListByExt(root,ext):
		if len(re.findall(r'%s'%_name, file)) > 0:
			print file
"""
example
"""				
#findFileMatchStr("/Users/tanzuoliang/Documents/projects/tank/res/new_ui",r"battleUI/.+?\b",".json")
#checkoutFileBySize("/Users/tanzuoliang/Documents/projects/tank/res/new_ui")	
#findFilePath("/Users/tanzuoliang/Documents/projects/art/天天坦克","zhandou_jineng__kuang_zz.png")
#repalceDirName("a","svnlog")

import zipfile
def hortPack():
	projectroot = raw_input("please input you projects path:\n")
	dirlist = []
	d = raw_input("please input the dir you want to pack into or enter exit for exit:\n")
	while not d == "exit":
		dirlist.append(d)
		d = raw_input("please input the dir you want to pack into or enter exit for exit:\n")
	f = raw_input("please the version where you want to collect from:\n")
	t = raw_input("please the version where you want to collect to:\n")
	store = raw_input("please enter to storename:\n")
	retlist = []
	for d in dirlist:
		dd = os.path.join(projectroot, d)
		if not os.path.exists(dd) or not os.path.isdir(dd):
			print "%s is not exits or is not a dir"%dd
		ret = os.popen("svn diff %s -r r%s:%s --summarize"%(dd,f,t)).readlines()
		
		for l in ret:
			change = l[1:].strip()
			retlist.append(change)
	print retlist
	z = zipfile.ZipFile(store,"w")
	for f in retlist:
		z.write(f,f.replace(projectroot,""))
		
		
def hortPack2(projectroot,dirlist,staticfilelist,f,t,store):
	retlist = []
	for d in dirlist:
		dd = os.path.join(projectroot, d)
		if not os.path.exists(dd) or not os.path.isdir(dd):
			print "%s is not exits or is not a dir"%dd
		ret = os.popen("svn diff %s -r r%s:%s --summarize"%(dd,f,t)).readlines()
		
		for l in ret:
			change = l[1:].strip()
			retlist.append(change)
	print retlist
	z = zipfile.ZipFile(os.path.join(projectroot, store) + ".zip","w")
	for f in retlist:
		if not os.path.exists(f):
			continue
		z.write(f,f.replace(projectroot,""))
	for f in staticfilelist:
		if not os.path.exists(f):
			continue
		z.write(os.path.join(projectroot,f),f)			
			
#hortPack2('/Users/tanzuoliang/Documents/projects/tank',['res','src'],"200","300","hort_res_00")			
							
							
from PIL import Image
def createGIF(fileName,imageDir):
	l = [Image.open(f) for f in glob.glob("%s/*.png"%imageDir)]
	writeGif(fileName,l)
	for im in l:
		im.close()	

def create(root):
	for dir in os.listdir(root):
		if not "DS_Store" in dir:
			out = os.path.join(root,dir)
			if os.path.isdir(out):
				createGIF(os.path.join(root,"%s.gif"%dir), out)
				

"""
GameIcon("./icon.png","res/effect/2000_atklaunch_D.png","./icon_out").start()
"""				
from PIL import Image
class GameIcon():
	def __init__(self,icon,water,out):
		
		self.android_size = {"drawable":48,"drawable-hdpi":72,"drawable-ldpi":36,"drawable-mdpi":48,"drawable-xhdpi":96,"drawable-xxhdpi":144,"max":512}
		self.ios_size = [29,40,50,57,58,72,76,80,87,100,114,120,144,152,175,180,512]
		self.icon = icon
		self.water = water
		self.outdir = out
		self.create_dir(self.outdir)
	
	def create_dir(self,_dir):
		if not os.path.exists(_dir):
			os.system("mkdir %s && chmod -R 777 %s"%(_dir,_dir))
			print "create ",_dir
	
	def start(self,platform="android"):
		self.megerimage()
			
		if platform == "android":
			for d in self.android_size:
				dd = os.path.join(self.outdir,d)
				self.create_dir(dd)
				self.resize(self.android_size[d], os.path.join(dd, "icon.png"))
		elif platform == "ios":
			for si in self.ios_size:
				self.resize(si, os.path.join(self.outdir, "Icon-%d.png"%si))
				
	
	def megerimage(self):
		if self.water and os.path.exists(self.water):
			with Image.open(self.icon) as icon_im, Image.open(self.water) as water_im:
				self.im = Image.alpha_composite(icon_im, water_im)
		else:
			with Image.open(self.icon) as icon_im:
				self.im = Image.new("RGBA", (icon_im.width,icon_im.height))
				self.im.paste(icon_im)
		
	
	def resize(self,size,f):
		cim = self.im.copy()
		cim.thumbnail((size,size))
		cim.save(f)											
			
				
from optparse import OptionParser
def getparse(itemlist):
	parser = OptionParser()
	for item in itemlist:
		if not 'name' in item:
			continue
		if not 'desc' in item:
			item['desc'] = item['name']
		if not 'help' in item:
			item['help'] = ""
		if not 'default' in item:
			item['default'] = 0
		if not 'dest' in item:
			item['dest'] = item['desc']
					
		parser.add_option('-%s'%item['name'],'--%s'%item['desc'],dest = item['dest'],help = item['help'], default = item['default'])
		
	(options,args) = parser.parse_args();
	return options	
					
				
		
	
		