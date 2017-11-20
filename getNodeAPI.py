#!/usr/bin/python
#encoding=utf-8

import requests,re,os


def getHrefs(text):
	return filter(lambda e: not "#" in e ,re.findall(r'href="(.+?)"',text))

def saveContext(url,context):
	print "save ",url
	store = re.sub(r'http://(.+?)/',"",url)
	_dir = os.path.dirname(store)
	if not os.path.exists(_dir):
		os.makedirs(_dir)
	with open(store,"w") as f:
		f.write(context)	
		print "write file to ",store
	print "-------------------------------------------------------------------------- \n"	


def DectorGet(fun):
	urlDict = {}
	def wrapper(url,rootUrl):
		if not url  in urlDict:
			urlDict[url] = True
			print "push ",url
			fun(url,rootUrl)
		else:
			print "url ",url," has handled"
	return wrapper
				
@DectorGet
def getContext(url,rootUrl):
	try:
		context = requests.get(url=url).content
		saveContext(url,context)
	except Exception as 	e:
		print e
		return
	for href in getHrefs(context):
		if "css" in href:		
			if not "http://" in href:
				href = "".join([rootUrl,href])
			getContext(href,rootUrl)
									
getContext("http://nodejs.cn/api/documentation.html","http://nodejs.cn/api/")			