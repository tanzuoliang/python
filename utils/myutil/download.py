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
		print(self.__get_info())
		
		
		
		
		
"""
window.parent.frames.MacPlayer.PlayUrl
"""		
def downloadVideo(url,storeFile=None,checkSize = 0):
	'''
	下载视频
	:param url: 下载url路径
	:return: 文件
	'''
	with closing(requests.get(url, stream=True)) as response:
		chunk_size = 1024
		try:
			basename = os.path.basename(url)
			content_size = int(response.headers['content-length'])
			if checkSize > 0 and content_size < checkSize:
				print "ignore ",basename ," because size %d less than %d"%(content_size,checkSize)
				return 
			file_D = storeFile if storeFile else "./%s"%(basename)
			print file_D
			if(os.path.exists(file_D)  and os.path.getsize(file_D)==content_size):
				print('jump '+basename)
			else:
				print "start to download ",url
				progress = ProgressBar(basename.split(".")[0], total=content_size, unit="KB", chunk_size=chunk_size, run_status="正在下载",fin_status="下载完成")
				with open(file_D, "wb") as file:
					for data in response.iter_content(chunk_size=chunk_size):
						file.write(data)
#						progress.refresh(count=len(data))	
		except Exception as e:
			print e	,'jump '+basename

storeImages = "./images2"
						
if not os.path.exists(storeImages):
	os.mkdir(storeImages)
	
	
def findImags(root,depth,hasCheckHtmls):
	hasCheckHtmls.append(root)
	print("start to check %s depth = %d"%(root,depth))
	content = requests.get(url = root).text
	htmls = re.findall(r'href="(\S+?\.html)',content)
	images = re.findall(r'src="(\S+?\.jpg)',content)
	print images	
	for url in images:
		if not "_avatar_" in url:
			if not "http" in url:
				url = os.path.join(root, url)
			downloadVideo(url,os.path.join(storeImages, os.path.basename(url)),checkSize=102400)

	
#	if depth < 5:
#		for html in htmls:
#			if not html in hasCheckHtmls:
#				if "http://" in html:
#					findImags(html,depth + 1,hasCheckHtmls)
#				else:
#					print "drop path: " , html		
#			else:
#				print "path: " , root, " has query"
	
findImags('http://www.lesmao.cc/thread-17686-3-1.html',0,[])						