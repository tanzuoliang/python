#!/usr/bin/python
#encoding=utf-8
import os,shutil
from optparse import OptionParser


"""
	reSignApk.py -a /Users/tanzuoliang/Downloads/letv.apk.zip -k xujun -p 123456 -s /Users/tanzuoliang/projects/keystore/tankTV.keystore -o levt-1.0.3
	
"""

def signAPK(option):	
	apkname = option.file
	dir_name = os.path.dirname(apkname)
	
	signname = os.path.join(dir_name,"%s-release.apk"%option.outfile)
	zipname = os.path.join(dir_name,"%s-align.apk"%option.outfile)
	jcm = '/Library/Java/JavaVirtualMachines/1.6.0.jdk/Contents/Home/bin/jarsigner'
#	jcm = 'jarsigner'
#	cmd = "%s -verbose -keystore tianyi_facebook.keystore -digestalg SHA1 -storepass tianyi2017 -keypass tianyi2017 -sigalg MD5withRSA -signedjar %s %s tianyi"%(jcm,signname,apkname)
	cmd = "%s -verbose -keystore %s -digestalg SHA1 -storepass %s -keypass %s -sigalg MD5withRSA -signedjar %s %s %s"%(jcm,option.storeFile,option.keyPass,option.keyPass,signname,apkname,option.keyAlias)
	
	print "cmd = ",cmd
	os.system(cmd)
	os.system("zipalign -v 4 %s %s"%(signname,zipname))
	os.system('rm %s'%signname)
	os.system("say %s"%'结束了')

def removeOldCert(apkname):
	os.system("aapt r -v %s META-INF/MANIFEST.MF"%(apkname))
	os.system("aapt r -v %s META-INF/CERT.RSA"%(apkname))
	os.system("aapt r -v %s META-INF/CERT.SF"%(apkname))
	
if __name__ == "__main__":
	parser = OptionParser()
	
	parser.add_option('-d', '--desc',dest='desc',help='a   .apk\n-k   keyAlias\n-p   keyPass\n-s   keyStore\n-o   outsavename')
	parser.add_option('-a', '--file',dest='file',help='要重签名的文件')
	parser.add_option('-k', '--keyAlias',dest='keyAlias',help='签名文件别名')
	parser.add_option('-p', '--keyPass',dest='keyPass',help='签名文件密码')
	parser.add_option('-s', '--storeFile',dest='storeFile',help='签名文件')
	parser.add_option('-o', '--outfile',dest='outfile',help='输出文件')
	(option,args) = parser.parse_args()
	print args
	if option.file:
		removeOldCert(option.file)
		signAPK(option)
	else:
		print """-a   .apk\n-k   keyAlias\n-p   keyPass\n-s   keyStore\n-o   outsavename """	
