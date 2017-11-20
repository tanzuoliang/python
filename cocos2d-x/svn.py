#encoding=utf-8

from optparse import OptionParser
import os,sys,json,time
from python.copyFile import Copy
from python.tools import Tools
import zipfile



class SVN():
	"""docstring for SVN"""
	def __init__(self,mode,time,version):
		# self.arg = arg
		self.mode = mode
		self.time = time
		self.inputversion = version
		self.outdir = "hot_res"
		self.src = "src"
		self.res = "res"
		self.copy = Copy()
		self.copy.createDir(self.outdir)
		self.recodepath = "%s/recode.json"%self.outdir
		self.tools = Tools()
		
		self.log = "%s/log.json"%self.outdir
		self.logdata = ""

		self.packversionPath = "%s/version.json"%self.outdir
		self.packversion = int(self.copy.getFileData(self.packversionPath,"0")) + 1
		self.hotVersion = "1.0.%d"%self.packversion

		self.hotSaveDir = "%s/%s"%(self.outdir,self.hotVersion)
		self.copy.createDir(self.hotSaveDir)

		if self.mode == "init":
			self.createRecode()
		elif self.mode == "pack":
			self.getDiff()	
		elif self.mode == "repack":
			self.packversion = int(self.inputversion)
			self.hotVersion = "3.0.%d"%self.packversion
			self.hotSaveDir = "%s/%s"%(self.outdir,self.hotVersion)
			self.packHotRes(self.hotSaveDir)	

	def saveRecode(self):
		f = open(self.recodepath,"w")
		json.dump(self.recodedata,f)
		f.close()	

	def getDiff(self):

		f = open(self.recodepath,"r")
		self.recodedata = json.load(f)
		f.close()

		self.getDiffSignalDir(self.res)
		self.getDiffSignalDir(self.src)
		self.saveRecode()

		f = open(self.log,"w")
		f.write(self.logdata)
		f.close()

		self.packHotRes(self.hotSaveDir)

	def getDiffSignalDir(self,dir):
		for item in os.walk(dir):
			if not item[2]:
				continue
			for f in item[2]:
				file = os.path.join(item[0],f)
				t = os.path.getmtime(file)
				oldTime = 0
				if file in self.recodedata:
					oldTime = self.recodedata[file]
				"""
					check weather mofidy file or not 
				"""	
				checknow = self.time == 0.0 and t > oldTime
				timesperate = time.time() - self.time * 3600
				checktime = self.time > 0.0 and t > timesperate
				"""
					有两种比对 
					1.如果输入的时间是now那么只比对当前文件的个性时间和记录的时间差值大于0 认不文件是修改过的
					2.如果输入时间（以小时为单位）则计算当前时间前n个小时内有修改过的文件
				"""
				if checknow or checktime:		
					self.recodedata[file] = t
					self.copy.copyFile(file,"%s/%s"%(self.hotSaveDir,file))
					self.logdata = self.logdata + file + "\n"


	def packHotRes(self,versionDir):
		res = "%s/res"%versionDir
		src = "%s/src"%versionDir
		if not os.path.exists(res) and not os.path.exists(src):
			print "no res need zip %s %s"%(res,src)
			sys.exit()	

		self.tools.jscompile("%s/src"%versionDir)
		zf = zipfile.ZipFile("%s/%d.zip"%(self.outdir,self.packversion),"w",zipfile.zlib.DEFLATED)

		def zipDir(dir):
			for item in os.walk(dir):
				if not item[2]:
					continue
				for f in item[2]:
					file = os.path.join(item[0],f)
					name = file[len(versionDir):]
					# name = file
					zf.write(file,name)	

				
		zipDir(res)
		zipDir(src)

		vf = "%s/game_version.json"%self.outdir
		f = open(vf,"w")
		json.dump({"version":self.hotVersion},f)
		f.close()
		zf.write(vf,"game_version.json")	

		self.copy.saveDataToFile(self.packversionPath,str(self.packversion))	
						

	def createRecode(self):
		f = open(self.recodepath,"w")
		self.recodedata = {}
		si = self.tools.getdirsize(self.res)
		maxSize = 1024 * 1024 * 400
		if not si > maxSize:
			self.createRecodeSignalDir(self.res)
		else:
			self.tools.alert("请先压缩资源在操作")	
			return
		if os.path.exists("%s/resource.js"%self.src):
			self.createRecodeSignalDir(self.src)
		else:
			self.tools.alert("请记录JS而不是JSC")	
			return
		json.dump(self.recodedata,f,indent=2)
		f.close()


	def createRecodeSignalDir(self,dir):

		for item in os.walk(dir):
			if not item[2]:
				continue

			for f in item[2]:
				file = os.path.join(item[0],f)
				t = os.path.getmtime(file)
				self.recodedata[file] = t
			




if __name__ == '__main__':

	parser = OptionParser();
	parser.add_option('-m','--mode', dest='mode' ,help="操作模式 init 初始化时间 | pack 先获取修改的文件再打包 | repack 仅仅只是打包")
	parser.add_option('-t','--time', dest='time' ,help="时间以小时为单位",default=0.0)
	parser.add_option('-v','--version', dest='version' ,help="指定要重新打包的资源版本号")

	(options,args) = parser.parse_args();
	version = "default"
	if not options.mode:
		print "miss mode"
		sys.exit()
	else:
		li = ["init","pack","repack"]
		print("mode " + options.mode)
		if not options.mode in li:
			print "mode value just need %s"%"  ".join(li)	
		else:
			if options.mode == "repack":
				if not options.version:
					print "miss version while repack"
					sys.exit()
				else:
					version = int(options.version)
					if not version > 0:
						print "version must be rather than zero"
						sys.exit()
	t = 0
	if options.time:
		t = float(options.time)

	print "start execute"
	if t < 0:
		print "time can't less than zero"
		sys.exit()



	SVN(options.mode,t,version)		


			