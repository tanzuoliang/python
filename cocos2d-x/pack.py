#usr/local/bin

from python.tools import Tools
from optparse import OptionParser
import os,sys,shutil,json
import zipfile

from python.copyFile import Copy



class Handler():

	def __init__(self):
		self.res = "res"
		self.tools = Tools()
		self.copy = Copy()
		self.packCount = 0
		self.toDir = "res_zip"
		self.MB = 1024 * 1024 * 30
		self.filterlist = ["effectexportjson","font","fonts","gameConfig","icon","login","music","onlineUpdate","particles","shaders","yayasdk"];
		self.baselist = ["res/%s"%n for n in self.filterlist]
		print self.baselist


		self.filterFilelist = ["res/heroInfo_1/%s"%n for n in ["warning_bg.png","common_button1_normal.png","common_button1_down.png","common_button1_disable.png","common_button2_normal.png","common_button2_down.png","warning_notice_view.json"]]


		self.currentVersion = 1
		self.currentVersionFlag = "3.0.%d"

		self.out_zip = "out_zip"
		if  os.path.exists(self.out_zip):
			shutil.rmtree(self.out_zip)
		os.makedirs(self.out_zip)



		self.baseDir = "base"
		if not os.path.exists(self.baseDir):
			os.makedirs(self.baseDir)

		if not os.path.exists(self.toDir):
			os.makedirs(self.toDir)
		else:
			if os.path.exists(self.toDir + "/res"):
				shutil.rmtree(self.toDir + "/res")	

		self.currentDir = ""
		self.currentZipDir = ""
		self.currentPackSize = 0

		self.handerBase()
		# return;

		self.createZipDir()
		self.startup(self.res)
		self.packmusic();

		os.system("zip -r %s.zip %s"%(self.out_zip,self.out_zip))


	def packmusic(self):
		to = "%s/res/music/android"%self.toDir
		if not os.path.exists(to):
			os.makedirs(to)
		self.copy.copyFiles("music/android",to)	
		self.handlerVersion()		
		self.zipCurerntPack()	

	def handlerVersion(self):
		d = {"version":self.currentVersionFlag%self.currentVersion}
		json.dump(d,open( "%s/game_version.json"%self.toDir,"w"))
		self.currentVersion = self.currentVersion + 1


	def handerBase(self):
		for _dir in self.baselist:
			to = self.baseDir + "/" + _dir
			self.copy.copyFiles(_dir,to)

		for file in self.filterFilelist:
			to = self.baseDir + "/" + file
			self.copy.copyFile(file,to)		

	def startup(self,dir):
		
		for item in os.walk(dir):
			if not item[2]:
				continue

			rootbaseList = item[0].split("/")
			l = len(rootbaseList)
			if l > 1 and rootbaseList[1] in self.filterlist:
				print "filter dir %s"%rootbaseList[1]
				continue

			for file in item[2]:
				fromFile = os.path.join(item[0],file)
				if fromFile in self.filterFilelist:
					print("file %s in base so filter"%fromFile)
					continue
				toFile = fromFile.replace(self.res, self.currentDir,1)
				self.currentPackSize = self.currentPackSize + os.path.getsize(fromFile)
				self.copy.copyFile(fromFile,toFile)
				self.checkDir()


		# self.handlerVersion()		
		# self.zipCurerntPack()		
		self.checkDir(ingore=True)

	def zipCurerntPack(self):
		c = os.getcwd()
		# os.chdir(self.toDir)
		# os.system("zip -r %s/%s_%d.zip %s"%(self.out_zip,self.res,self.packCount,self.toDir))
		# os.chdir(c)

		zf = zipfile.ZipFile("%s/%d.zip"%(self.out_zip,self.packCount),"w",zipfile.zlib.DEFLATED)
		for item in os.walk(self.toDir):
			if not item[2]:
				continue
			for file in item[2]:
				_file = os.path.join(item[0],file)
				_name = _file[len(self.toDir):]
				zf.write(_file,_name)	
		shutil.rmtree(self.currentDir)	

	def createZipDir(self):
		self.currentDir = "%s/res"%(self.toDir)
		

		if not os.path.exists(self.currentDir):
			os.makedirs(self.currentDir)

		self.packCount = self.packCount + 1
		self.currentPackSize = 0

	def checkDir(self,ingore=False):
		if ingore or self.currentPackSize > self.MB:
			self.handlerVersion()
			self.zipCurerntPack()
			self.createZipDir()

if __name__ == '__main__':


	print "cwd = %s"%os.getcwd()
	print "sys.argv[0] =  %s"%sys.argv[0]

	cwd = os.getcwd();
	if not cwd == sys.argv[0]:
		dirpath = os.path.dirname(sys.argv[0])
		if not dirpath == "":
			os.chdir()

	print "cwd = %s"%os.getcwd()	

	Handler()