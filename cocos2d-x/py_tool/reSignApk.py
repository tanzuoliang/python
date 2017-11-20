#!/usr/bin/python
import os,shutil

def signAPK(apkname):	
	base_name = os.path.basename(apkname)
	base_name_l = base_name.split(".")
	print base_name_l
	dir_name = os.path.dirname(apkname)
	signname = os.path.join(dir_name,"out-release.apk")
	zipname = os.path.join(dir_name,"out-align.apk")
	jcm = '/Library/Java/JavaVirtualMachines/1.6.0.jdk/Contents/Home/bin/jarsigner'
#	jcm = 'jarsigner'
	cmd = "%s -verbose -keystore tianyi_facebook.keystore -digestalg SHA1 -storepass tianyi2017 -keypass tianyi2017 -sigalg MD5withRSA -signedjar %s %s tianyi"%(jcm,signname,apkname)
#	jcm = 'jarsigner'
#	cmd = "%s -verbose -keystore ../../../keystore/tianyi_facebook.keystore -digestalg SHA1 -storepass tianyi2017 -sigalg MD5withRSA -tsa https://timestamp.geotrust.com/tsa -signedjar %s %s tianyi"%(jcm,signname,apkname)
	os.system(cmd)
#	print cmd
#	os.system("zipalign -v 4 %s %s"%(signname,zipname))
#	os.system('rm %s'%signname)
	
if __name__ == "__main__":
	apkname = raw_input("please input a apk:\n")
	while True:
		platform_json = raw_input("input new platfomjson:\n")
		if os.path.basename(platform_json) == "platform.json":
			os.system("aapt r -v %s assets/platform.json"%(apkname))
			os.system("aapt r -v %s META-INF/MANIFEST.MF"%(apkname))
			os.system("aapt r -v %s META-INF/CERT.RSA"%(apkname))
			os.system("aapt r -v %s META-INF/CERT.SF"%(apkname))
			if not os.path.exists("assets"):
				os.mkdir("assets")
			pl = "assets/platform.json"	
			shutil.copyfile(platform_json, pl)
			os.system("aapt a -v %s %s"%(apkname,pl))
			os.system("rm -rf %s"%(pl))
			break
	signAPK(apkname)	