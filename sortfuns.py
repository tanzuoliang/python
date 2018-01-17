#/usr/local/bin
#encoding=utf-8
import re


def sortDector(fun):
	def wrap(ls):
		fun(ls)
		print ls 
	return wrap	

"""
交换数组数据
"""
def swap(ls,f,t):
	if not f == t:
	 temp = ls[f]
	 ls[f] = ls[t]
	 ls[t] = temp

"""
冒泡排序
"""
@sortDector
def bubble_sort(ls):
	cycleCount = 0
	swapCount = 0
	
	le = len(ls)
	for i in xrange(le - 1):
		for j in xrange(1,le - i):
			if ls[j - 1] > ls[j]:
				swap(ls,j - 1,j)
				swapCount = swapCount + 1
			cycleCount = cycleCount + 1	
	print "{2} cycleCount = {0} swapCount = {1}".format(cycleCount,swapCount,"bubble_sort")
"""
简单选择排序
"""
@sortDector				
def select_sortleft(ls):
	cycleCount = 0
	swapCount = 0
	
	le = len(ls)
	for i in xrange(le - 1):
		temp = ls[i]
		k = i
		for j in xrange(i,le):				
#			if (mode == -1 and ls[j] < temp) or (mode == 1 and ls[j] > temp):
			if ls[j] < temp:
				k = j
				temp = ls[j]	
			cycleCount = cycleCount + 1	
		swap(ls, k, i)
		swapCount = swapCount + 1
	print "{2} cycleCount = {0} swapCount = {1}".format(cycleCount,swapCount,"select_sortleft")	

@sortDector		
def select_sortRight(ls):
	cycleCount = 0
	swapCount = 0
	
	le = len(ls)
	for i in xrange(le - 1):
		temp = ls[0]
		k = 0
		for j in xrange(1,le - i):				
#			if (mode == -1 and ls[j] < temp) or (mode == 1 and ls[j] > temp):
			if ls[j] > temp:
				k = j
				temp = ls[j]	
			cycleCount = cycleCount + 1
					
		swap(ls, k, j)
		swapCount = swapCount + 1
		
	print "{2} cycleCount = {0} swapCount = {1}".format(cycleCount,swapCount,"select_sortRight")	

"""
移动数组
"""
def moveList(ls,index,num):
	count = 0
	while ls[index] > num and index > -1:
		ls[index + 1] = ls[index]
		index = index - 1
		count = count + 1
		
	return index + 1,count	

"""
插入排序
"""
@sortDector		
def insert_sort(ls):
	cycleCount = 0
	swapCount = 0
	print ls
	le = len(ls)
	for i in xrange(le - 1):
		check = ls[i]
		for j in xrange(i + 1,le):
			temp = ls[j]
			if temp < check:
#				print "temp = {0} check = {1}".format(temp,check)
				retTuple = moveList(ls, j - 1, temp)
				ls[retTuple[0]] = temp
				swapCount = swapCount + 1
				cycleCount = cycleCount + retTuple[1]	
			else:
				cycleCount = cycleCount + 1	
				
	print "{2} cycleCount = {0} swapCount = {1}".format(cycleCount,swapCount,"insert_sort")			
						
					
"""
快速排序
"""
@sortDector	
def quick_sort(ls):

	retMap = {"cycleCount":0,"swapCount":0}
	def execute(ls,start_index,end_index,tag,retMap):
		left_point = start_index
		right_point = end_index
		check_num = ls[start_index]
	
		while left_point < right_point:
			while ls[right_point] > check_num:
				right_point = right_point - 1
				retMap["cycleCount"] = retMap["cycleCount"] + 1
			swap(ls, right_point, left_point)
			retMap["swapCount"] = retMap["swapCount"] + 1

			while ls[left_point] < check_num:
				left_point = left_point + 1
				retMap["cycleCount"] = retMap["cycleCount"] + 1
			swap(ls, right_point, left_point)
			retMap["swapCount"] = retMap["swapCount"] + 1
		
		
		if start_index < left_point:
			execute(ls, start_index, left_point - 1,"left",retMap)
			
		if right_point < end_index:
			execute(ls, right_point + 1, end_index,"right",retMap)
	execute(ls,0,len(ls) -1,"root",retMap)
	
	print "{2} cycleCount = {0} swapCount = {1}".format(retMap["cycleCount"],retMap["swapCount"],"quick_sort")					

"""
两端排弃
"""
@sortDector			
def port_sort(ls):
	
	le = len(ls)
	half = int(le * 0.5) if le % 2 == 0 else int(le * 0.5) + 1
#	print "half = ",half
	cycleCount = 0
	swapCount = 0
	for i in xrange(half):
	
		startIndex = i
		endIndex = le - i - 1
		minValue = ls[startIndex]
		maxValue = ls[endIndex]
		
		minIndex = -1
		maxIndex = -1
		
#		print "start from {0} to {1} min = {2} max = {3}".format(startIndex,endIndex,minValue,maxValue)
		for k in xrange(i,endIndex):
			cur_data = ls[k]
			if cur_data > maxValue:
				maxValue = cur_data
				maxIndex = k
			if cur_data < minValue:
				minValue = cur_data
				minIndex = k
			cycleCount = cycleCount + 1		
					
		if minIndex > -1:
			swap(ls, startIndex, minIndex)	
			swapCount = swapCount + 1
						
		if maxIndex > -1:
			swap(ls, endIndex, maxIndex)
			swapCount = swapCount + 1
		
	print "{2} cycleCount = {0} swapCount = {1}".format(cycleCount,swapCount,"port_sort")
					
					
if __name__ == "__main__":
	baseList = [34,21,13,67,89,2,5,14,100,11,10000,2001,45,43,23,456,421,3456,7854]
	print "baselist",baseList
	insert_sort(baseList[:])
	port_sort(baseList[:])
	bubble_sort(baseList[:])
	select_sortleft(baseList[:])
	select_sortRight(baseList[:])
	quick_sort(baseList[:])
	
