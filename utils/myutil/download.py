#!/usr/bin/python
#encoding=utf-8
import requests,os,re
from contextlib import closing

"""
os.system('adb push /Users/tanzuoliang/Documents/study/python/utils/myutil/movies/%s /sdcard/movies/a%s'%(na,na))
"""

#import requests
# 
#url = 'http://127.0.0.1:5000/upload'
#files = {'file': open('/home/lyb/sjzl.mpg', 'rb')}
##files = {'file': ('report.jpg', open('/home/lyb/sjzl.mpg', 'rb'))}     #显式的设置文件名
# 
#r = requests.post(url, files=files)
#print(r.text)


class ProgressBar(object):
	def __init__(self, title, count=0.0, run_status=None, fin_status=None, total=100.0, unit='', sep='/',
				 chunk_size=1.0):
		super(ProgressBar, self).__init__()
		self.info = "[%s] %s %.2f %s %s %.2f %s     percent = %.2f"
		self.title = title
		self.total = total
		self.count = count
		self.chunk_size = chunk_size
		self.status = run_status or ""
		self.fin_status = fin_status or " " * len(self.statue)
		self.unit = unit
		self.seq = sep

	def __get_info(self):
		# 【名称】状态 进度 单位 分割线 总数 单位
		_info = self.info % (
			"file", self.status, self.count / self.chunk_size, self.unit, self.seq, self.total / self.chunk_size,
			self.unit,(100 * self.count) / self.total)
		return _info

	def refresh(self, count=1, status=None):
		self.count += count
		# if status is not None:
		self.status = status or self.status
		end_str = "\r"
		if self.count >= self.total:
			end_str = '\n'
			self.status = status or self.fin_status
#		print(self.__get_info())
		
		
		
		
		
"""
window.parent.frames.MacPlayer.PlayUrl
"""		
def downloadVideo(url,storeFile=None,checkSize = 0):
#	print "ready to download ",url
	'''
	下载视频
	:param url: 下载url路径
	:return: 文件
	'''
	try:
		with closing(requests.get(url, stream=True)) as response:
			chunk_size = 1024
			try:
				basename = os.path.basename(url)
				content_size = int(response.headers['content-length'])
				if checkSize > 0 and content_size < checkSize:
#					print "ignore ",basename ," because size %d less than %d"%(content_size,checkSize)
					return 
				file_D = storeFile if storeFile else "./%s"%(basename)
				print 'file_D = ',file_D
				if(os.path.exists(file_D)  and os.path.getsize(file_D)==content_size):
#					print('jump '+basename)
					pass
				else:
					progress = ProgressBar(basename.split(".")[0], total=content_size, unit="KB", chunk_size=chunk_size, run_status="正在下载",fin_status="下载完成")
					with open(file_D, "wb") as file:
						for data in response.iter_content(chunk_size=chunk_size):
							file.write(data)
							progress.refresh(count=len(data))	
			except Exception as e:
				print e	,'jump '+basename
	except Exception as e:
		print e		

storeImages = "/Users/tianyi/Documents/images2"
						
if not os.path.exists(storeImages):
	os.mkdir(storeImages)

import json	
def recode(hasCheckHtmls):
	with open(os.path.join(storeImages, ".recode"),"w") as f:
		f.write(json.dumps(hasCheckHtmls))

def getHost(root):
	root = root.replace('http://',"")
	root = root.split("/")[0]
	return "http://" + root

def getSaveDir(f):
#	print "---------------------- f = ",f
	name = "f" + f.split("_")[0]
	num = f.split("_")[1]
	ss = os.path.join(storeImages, name)
	if not os.path.exists(ss):
		os.mkdir(ss)
	return ss	

def sortHtmls(htmls,checkTag = "thread-"):
	ret = []
	for i in htmls:
		if checkTag in i:
			ret.insert(0, i)
		else:
			ret.append(i)
	return ret			
	
	
def findImags(root,depth,hasCheckHtmls):
	hasCheckHtmls.append(root)
#	recode(hasCheckHtmls)
	print("start to check %s depth = %d"%(root,depth))
	try:
		content = requests.get(url = root).text
		htmls = sortHtmls(re.findall(r'href="(\S+?\.html)',content))
		images = re.findall(r'src="(\S+?\.jpg)',content)
		if "thread-" in root:
			print htmls	
			for url in images:
				if not "_avatar_" in url:
					if not "http" in url:
						url = os.path.join(root, url)
	#				downloadVideo(url,os.path.join(storeImages, os.path.basename(url)),checkSize=102400)
					if "_" in url:
						base_name = os.path.basename(url)
						downloadVideo(url,os.path.join(getSaveDir(base_name),base_name),checkSize=102400)

		
		if depth < 5:
			for html in htmls:
				if not html in hasCheckHtmls:
					if not "http://" in html:
						html = getHost(root) + "/" + html
					findImags(html,depth + 1,hasCheckHtmls)			
	#			else:
	#				print "path: " , root, " has query"
	except Exception as e:
		print e

hasCheckHtmls = []
#if os.path.exists(os.path.join(storeImages, ".recode")):
#	with open(os.path.join(storeImages, ".recode"),"r") as f:
#			hasCheckHtmls = json.loads(f.read())	
findImags('http://www.lsmpx.com/thread-14979-2-1.html',0,hasCheckHtmls)		


from glob import glob
def splitGroup():
	for f in glob(os.path.join(storeImages,"*.jpg")):
		f = f.replace(storeImages + "/","")
		name = "f" + f.split("_")[0]
		num = f.split("_")[1]
		ss = os.path.join(storeImages, name)
		print ss
		if not os.path.exists(ss):
			os.mkdir(ss)
		os.system("mv %s %s"%(os.path.join(storeImages, f),os.path.join(ss, f)))	
						