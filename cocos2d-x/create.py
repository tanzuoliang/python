#encoding=utf-8
import os,re
from helper.respack import PackRes
from myutil.utils import repalceDirName,copyFile,copyDir

"""
svn st | awk '{if ( $1 == "?") { print $2}}' | xargs svn add 
"""
p = PackRes("res","res-new")

def checkDir(fr,to):
	ls = []
	for item in os.walk(fr):
		if not item[2]:
			continue
		for f in item[2]:
			if not ".DS" in f:
				ls.append(os.path.join(item[0], f))
	for f in ls:
		ff = f.replace(fr,to)
		if not os.path.exists(ff):
			print	"lose file ",ff
			
def compressRes():
	p.run()
	checkDir("res-new","res")
	print "compress successfully"

def uncompressRes():
	p.resBackToNormal()

def updateVersion():
	path = "publish/android/.version.txt"
	version = 1
	if os.path.exists(path):
		with open(path,"r") as f:
			version = int(f.read())
	with open(path,"w") as f:
		f.write(str(version + 1))
	
	path = "frameworks/runtime-src/proj.android/res/values/strings.xml"
	
	data = None
	with open(path,"r") as f:
		data = f.read()
		data = re.sub(r'<integer name="app_version">\d+</integer>', r'<integer name="app_version">%d</integer>'%version,data)
#		data = re.sub(r'<string name="app_vname">.+</string>', r'<string name="app_vname">1.0.%d</string>'%version,data)
					
			
	with open(path,"w") as f:
		f.write(data)	
"""
去除语言分类重复和资源
"""
def handle_res(root):
	_dir = os.path.join(root,"res/language_img/lang_chs")
	for(_d,_,items) in os.walk(_dir):
		if items:
			for f in items:
				ff = os.path.join(_d,f).replace(_dir + "/","")
				if os.path.exists(ff):
					os.remove(ff)
					print "remove file  ==== ",ff	
					
"""
	编译JSC
"""						
def __decodeJS__(DIR="src"):
	if not os.path.exists(os.path.join(DIR, "app.jsc")):
		command = 'cocos jscompile -s' + DIR + ' -d ' + DIR + '_new'
		os.system(command)
		repalceDirName(DIR,DIR + '_new')
		
		

"""
	回到js
"""	
def backToJS(DIR="src"):
	if os.path.exists(os.path.join(DIR, "app.jsc")):
		repalceDirName(DIR,DIR + '_new')
		os.system("rm -rf %s"%(DIR + "_new"))

from myutil.utils import syncDir
"""
	拷贝资源到android-studio项目中
"""		
def copyResFromproject(toPath):
	fromPath = "."
	floder = "res"
#	os.system("rm -rf %s"%(os.path.join(toPath, floder)))
	syncDir(os.path.join(fromPath,floder), os.path.join(toPath, floder))


def handleMainjs():
	if not os.path.exists("mainjs"):
		os.makedirs("mainjs")
	if not os.path.exists("mainjs/main.js") or os.path.getmtime("mainjs/main.js") < os.path.getmtime("main.js"):
		os.system("cp ./main.js ./mainjs/main.js")
		os.system('cocos jscompile -s ./mainjs  -d ./mainjs')

"""
	拷贝代码到android-studio项目中
"""	
def copySrcFromproject(toPath):
	fromPath = "."
	floder = "src"
#	os.system("rm -rf %s"%(os.path.join(toPath, floder)))
	syncDir(os.path.join(fromPath,floder), os.path.join(toPath, floder))
	
	
	handleMainjs()
	
	main_js = os.path.join(toPath, "main.js")
	if os.path.exists(main_js):
		os.system('rm %s'%main_js)
	os.system("cp mainjs/main.jsc %s"%os.path.join(toPath, "main.jsc"))

"""
	回到正常模式下
"""	
def toNormalStatus():
	uncompressRes()
	backToJS()			
		
#from myutil.utils import getparse
from optparse import OptionParser	
	
if __name__ == '__main__':
	parser = OptionParser()
	parser.add_option('-p', '--platform',dest='platform',help='android ios android-studio normal')
	parser.add_option('-s', '--svnup',dest='svnup',help='execute svnup 1:yes 0:no')
	parser.add_option('-m', '--mode',dest='mode',help='operation  0:res and src 1:only src 2: only res')
#	option = getparse([{'name':'p','desc':'platform','help':'android ios android-studio normal'}])
	(option,_) = parser.parse_args()
	print option
	platform = ''
	svnup = option.svnup or '1'
	mode = option.mode or '0'
	
	if not option.platform:
		platform = raw_input("please input the platform that you want to ready!  android|ios|android-studio|normal\n")
	else:
		platform = option.platform
	
	if platform in ['android','ios','android-studio','normal']:
		toNormalStatus()
		if svnup == '1':
			os.system("svn up res && svn up src && svn up project.json && svn up main.js")
		handle_res(".")
		compressRes()
		if platform == 'ios':
			__decodeJS__()
			pass
		elif platform == 'android':
			os.system('cocos compile -p android -m release && python publish/android/justRun.py')
			toNormalStatus()
			copyDir("frameworks/runtime-src/proj.android/libs/armeabi","frameworks/runtime-src/proj.android-studio/app/ibs/armeabi")
			pass
		elif platform == 'android-studio':
			__decodeJS__()
			toPath = "frameworks/runtime-src/proj.android-studio/app/assets"
			if mode == '0':
				copyResFromproject(toPath)
				copySrcFromproject(toPath)
			elif mode == '1':
				copySrcFromproject(toPath)
			elif mode == '2':
				copyResFromproject(toPath)
						
			_ls = ["platform.json","game_version.json"]
			for f in _ls:
				copyFile(f, os.path.join(toPath, f))
			toNormalStatus()
			pass
		elif platform == 'normal':
			toNormalStatus()			
		pass
	else:
		print "the platform must be android|ios|android-studio|normal"	
				