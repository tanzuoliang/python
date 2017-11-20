
from cocosAndroid import createOfficalApk
import os

if __name__ == '__main__':
	proPath = "/Users/Virtue/Documents/work/project/client/tank"
	cwd = os.getcwd()
	if not cwd == proPath:
		os.chdir(proPath)
		os.system("python create.py")
	else:
		createOfficalApk()	
	