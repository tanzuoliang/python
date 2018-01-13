#!/usr/bin/python
#encoding=utf-8
import requests
import time,json
from myutil.mail import Email

raw_cookies = 'remember_82e5d2c56bdd0811318f0cf078b78bfc=eyJpdiI6Ik5yQm92YkprYUJiaVRmRHpydFVpSEE9PSIsInZhbHVlIjoiSXNkUzhyS2ZhWDhkUE9RcUM1eTVreU1wNnFrS3QzK1J6ajZVUVN3Sk1mVGt6WEVMU1QzeXFzR0ZXaUZOMFZ3dXVmcURzTTJrU3Y2YTBXblJOQW5oNGk1ZnRhS1A1QWdiTGJHK1NNSHMzZm89IiwibWFjIjoiMTk5NDQ0MWZiOGU4ZjgzOTU5ZDE4MTg1YjZhZmQzOWIzMmMyMWUzYmU4Y2YxOGIxZTA0OTk3NjVjYzZmMmM2NSJ9; api_session=eyJpdiI6IkpmeXJyeEVWTjllTW5oaStMdUpZTEE9PSIsInZhbHVlIjoidXRBK2dFR1JNRjFOYlI3NHZlMlFETnZPRjlSaHFsWU9zdEVDaFhrYXRldG5jUHJOVFM4VjFHMG92a2VDUmZGdnZBRHFrWVBRZXRXUWI4YVF3ZWM3aGc9PSIsIm1hYyI6ImI5YTI3N2UyNmVhMTg2YzY5NmRmM2YzOGE0YmI3NDAwZmY1OGUwN2E0MzE4NWUyYzg0MzVhMjVkN2UxYWYxY2MifQ%3D%3D; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2215f2842b41f106-0f1e62771844ba-31637c00-2359296-15f2842b420f04%22%7D; sensorsdata_is_new_user=true; _ga=GA1.2.1264137126.1508208982; _gid=GA1.2.977243223.1508208982'
_cookies={}  
_data = ''
for line in raw_cookies.split(';'):  
	key,value=line.split('=',1)#1代表只分一次，得到两个数据  
	_cookies[key]=value 
	_data = "%s&%s=%s"%(_data,key,value) 

def getDate():
	return time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time()))
#print _cookies
#print _data

def getHttp(ur):
#	ur = '%s%s'%(ur,_data)
	r = requests.get(url=ur,cookies=_cookies)
	r.encoding = 'gbk'
	ret = r.text
#	print ret
	return ret
	
def postHttp(ur,da):
	r = requests.post(url=ur,data=da,cookies=_cookies)
	r.encoding = 'gbk'
	ret = r.text
#	print ur,ret.decode("gb2312")
	return ret

def logTapDB():
	postHttp('https://www.tapdb.com/api/v1/auth/login', (('mobile','+8618217507816'),('password','Tianyi2017'),('remember',True)))

def log(info):
	with open("taplog.txt","a") as f:
		print >> f,info
	print info	

emaillist = ["393433696@qq.com","392936884@qq.com","yhs@tianyi-game.com"]
def sendEmail(title,context):
	log("发送邮件")
	e = Email("ysjwdaypm@163.com","xy19860912")
	time.sleep(3)
	e.send(emaillist, title, context)
	
lastInCome = -1		
def getTapData():
	global lastInCome
	ret = json.loads(getHttp('https://www.tapdb.com/api/v1/ga-overviews/predictions?date=%d000&pid=611'%int(time.time())))
	curicome	 = ret['data']['currentIncome']
	if curicome > lastInCome:
		if lastInCome > -1:
			sendEmail("通知", "今日电视端充值己经达到%d元,新增加了%d元"%(curicome,curicome - lastInCome))
	lastInCome = curicome	

IP = 'http://tv.tianyi-game.com/'
lastWaingTime = 0	
def getPlayerOnline():
	r = requests.get(url='%s?m=TestLi&a=getOnlineNum'%IP)
	num = int(r.text.split("'onlineNum' =>")[1].split(",")[0])
	log("[%s] player:%d"%(getDate(),num))
	if num > 800:
		curT = time.time()
		if (curT - lastWaingTime) > 900:
			lastWaingTime = curT
			sendEmail("警告", "电视端同时%d玩家在线"%num)
					

def watchData():
	logTapDB()
	while True:
		getTapData()
		getPlayerOnline()
		time.sleep(60)
	
watchData()	

	
