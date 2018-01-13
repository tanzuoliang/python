#!/usr/bin/python
#encoding=utf-8
import requests,time
from myutil.mail import Email
"""
 TV
"""
IP = 'http://tv.tianyi-game.com/'

emaillist = ["393433696@qq.com","lsl@tianyi-game.com","yhs@tianyi-game.com"]
emaillist = ["tzl@tianyi-game.com"]
#emaillist = ["393433696@qq.com"]
def sendEmail(num):
	print "发送邮件"
	e = Email("ysjwdaypm@163.com","xy19860912")
	time.sleep(3)
	e.send(emaillist, "警告", "电视端同时%d玩家在线"%num)

def getPlayerOnline():
	r = requests.get(url='%s?m=TestLi&a=getOnlineNum'%IP)
	num = int(r.text.split("'onlineNum' =>")[1].split(",")[0])
	print "player:%d"%num
	if num > 800:
		sendEmail(num)

while True:
	getPlayerOnline()
	time.sleep(60)