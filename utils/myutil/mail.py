#!/usr/bin/python
#encoding=utf-8
import os,sys
import getpass
import smtplib
import email.mime.multipart  
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
"""
	发送邮件
	example:
		e = Email("ysjwdaypm@163.com")
		e.send(["393433695@qq.com","393433696@qq.com","393433697@qq.com"], "image", "python test")
"""
class Email():
	def __init__(self,user,passward=None,HOST = 'smtp.163.com'):
		self.user = user
		self.mail = smtplib.SMTP()
		self.mail.connect(HOST)
		
		if passward:
			self.passwrod = passward
			self.login()
		else:
			self.getPassword()
		
	def getPassword(self):
		self.passwrod = getpass.getpass("please input you password:")
		if self.passwrod == "exit":
			sys.exit(0)
		self.login()
			
	def login(self):
		try:
			self.loginRet = self.mail.login(self.user,self.passwrod)
		except Exception as e:
			print e	
			self.getPassword()
			return
		self.loginSuccess = True if self.loginRet[0] == 235 else False
		print "login successfully" if self.loginSuccess else "login fail"
	
	"""
		toList: 收件列表 ["a@xx.com","b@xx.com"]
		subject: 主题
		text:  正文
		filelist	 文本附件列表 ［"a.txt","b.js","c.py",......］  			
		imageList 图片附件列表 ["a.png","b.jpg"]  
	"""
	def send(self,toList,subject,text,filelist=[],imageList=[]):
		if not self.loginSuccess:
			self.passwrod = raw_input("please input you password:\n")
			self.login()
			return
		content = MIMEText(text)
		attachFile = []
		for fileName in filelist:
			_name = os.path.basename(fileName)
			with open(fileName,"r") as f:
				attach = MIMEText(f.read(),'base64','gb2312')
				attach["Content-Type"] = 'application/octet-stream'
				attach["Content-Disposition"] = 'attachment;filename='"'%s'"''%_name
				attachFile.append(attach)
		
		for imFile in imageList:
			with open(imFile,"rb") as f:
				image = MIMEImage(f.read())
				image.add_header("Content-ID",'<image1>')
				image.add_header('content-disposition', 'attachment', filename=os.path.basename(imFile))
				attachFile.append(image)
		
		for to in toList:
			msg = email.mime.multipart.MIMEMultipart()
			msg['Subject'] = subject
			msg['From'] = self.user
			msg['To'] = to
			msg.attach(content)
			
			for attach in attachFile:
				msg.attach(attach)
			
			try:
				self.mail.sendmail(self.user, to, msg.as_string())
			except Exception as e:
				print "send mail to %s fail"%to
				print e
				